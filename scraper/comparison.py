"""Comparison engine: matches Treasure Bay odds against sharp lines, calculates EV."""

from __future__ import annotations
import logging
import sqlite3
from dataclasses import dataclass, field
from difflib import SequenceMatcher

from sharp_lines import (
    SharpEvent, SharpMarket, SharpSelection,
    PINNACLE, calculate_no_vig_line, get_no_vig_probability,
)

log = logging.getLogger("comparison")


@dataclass
class Opportunity:
    """A +EV or arb opportunity."""
    event_name: str
    sport: str
    start_time: str
    market_type: str        # moneyline, spread, total
    selection: str          # home, away, over, under
    tb_odds: int            # Treasure Bay American odds
    tb_line: float | None   # Spread/total value at TB
    sharp_odds: int         # Best sharp American odds (typically Pinnacle)
    sharp_book: str         # Which sharp book
    sharp_line: float | None
    true_prob: float        # No-vig probability from sharp market
    ev_percent: float       # Expected value as percentage
    is_arb: bool = False
    arb_profit: float = 0.0


def american_to_decimal(american: int) -> float:
    """Convert American odds to decimal."""
    if american > 0:
        return (american / 100) + 1
    elif american < 0:
        return (100 / abs(american)) + 1
    return 1.0


def _fuzzy_match(a: str, b: str) -> float:
    """Fuzzy string match ratio (0-1)."""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def match_events(
    tb_events: list[dict],
    sharp_events: list[SharpEvent],
    threshold: float = 0.55,
) -> list[tuple[dict, SharpEvent]]:
    """Match Treasure Bay events to sharp events by team names.

    tb_events: list of dicts from our DB (home_team, away_team, etc.)
    sharp_events: list of SharpEvent from The Odds API

    Returns matched pairs.
    """
    matched = []
    used_sharp = set()

    for tb in tb_events:
        tb_home = tb.get("home_team", "").lower()
        tb_away = tb.get("away_team", "").lower()

        if not tb_home or not tb_away:
            continue

        best_match = None
        best_score = 0

        for i, sharp in enumerate(sharp_events):
            if i in used_sharp:
                continue

            # Score: average of home+away match ratios
            home_score = _fuzzy_match(tb_home, sharp.home_team)
            away_score = _fuzzy_match(tb_away, sharp.away_team)
            score = (home_score + away_score) / 2

            if score > best_score:
                best_score = score
                best_match = (i, sharp)

        if best_match and best_score >= threshold:
            matched.append((tb, best_match[1]))
            used_sharp.add(best_match[0])
            log.debug("Matched: %s vs %s (score=%.2f)",
                      tb.get("event_name"), best_match[1].home_team, best_score)

    log.info("Matched %d/%d TB events to sharp lines", len(matched), len(tb_events))
    return matched


def find_opportunities(
    tb_event: dict,
    tb_snapshots: list[dict],
    sharp_event: SharpEvent,
    min_ev: float = 0.0,
) -> list[Opportunity]:
    """Compare TB odds against sharp lines for a single event.

    tb_snapshots: list of latest odds rows for this event from our DB.
    """
    opps = []

    for snap in tb_snapshots:
        mtype = snap["market_type"]
        side = snap["selection"]
        tb_american = snap["odds_american"]
        tb_line = snap.get("line")

        # Find matching sharp market
        sharp_mkt = None
        for m in sharp_event.markets:
            if m.market_type == mtype:
                sharp_mkt = m
                break

        if not sharp_mkt or side not in sharp_mkt.selections:
            continue

        # Get Pinnacle line first, fall back to any sharp
        sharp_sels = sharp_mkt.selections[side]
        pinnacle_sel = next((s for s in sharp_sels if s.book == PINNACLE), None)
        best_sel = pinnacle_sel or sharp_sels[0] if sharp_sels else None

        if not best_sel:
            continue

        # For spreads/totals, check that the lines are close enough to compare
        if mtype in ("spread", "total") and tb_line is not None and best_sel.point is not None:
            if abs(tb_line - best_sel.point) > 2.0:
                # Lines too different, not a meaningful comparison
                continue

        # Calculate true probability from sharp market (no-vig)
        opposite_side = _get_opposite(side)
        opp_sels = sharp_mkt.selections.get(opposite_side, [])
        opp_pinnacle = next((s for s in opp_sels if s.book == PINNACLE), None)
        opp_sel = opp_pinnacle or (opp_sels[0] if opp_sels else None)

        if opp_sel:
            # Two-way no-vig calculation
            no_vig_probs = calculate_no_vig_line([best_sel.price, opp_sel.price])
            true_prob = no_vig_probs[0] if no_vig_probs else get_no_vig_probability(best_sel.price)
        else:
            # Fallback: just use implied prob (includes vig)
            true_prob = get_no_vig_probability(best_sel.price)

        # Calculate EV
        tb_decimal = american_to_decimal(tb_american)
        ev = (true_prob * tb_decimal) - 1  # EV as a fraction
        ev_percent = ev * 100

        if ev_percent >= min_ev:
            opps.append(Opportunity(
                event_name=tb_event.get("event_name", ""),
                sport=tb_event.get("sport_id", ""),
                start_time=tb_event.get("start_time", ""),
                market_type=mtype,
                selection=side,
                tb_odds=tb_american,
                tb_line=tb_line,
                sharp_odds=best_sel.price,
                sharp_book=best_sel.book,
                sharp_line=best_sel.point,
                true_prob=round(true_prob, 4),
                ev_percent=round(ev_percent, 2),
            ))

    return opps


def _get_opposite(side: str) -> str:
    """Get the opposite side of a bet."""
    return {
        "home": "away",
        "away": "home",
        "over": "under",
        "under": "over",
    }.get(side, side)


def detect_arbs(opps: list[Opportunity]) -> list[tuple[Opportunity, Opportunity]]:
    """Find arbitrage pairs where TB + sharp opposite side guarantees profit.

    Returns pairs of opportunities that form an arb.
    """
    arbs = []
    # Group by event + market
    by_event_market: dict[str, list[Opportunity]] = {}
    for opp in opps:
        key = f"{opp.event_name}|{opp.market_type}"
        if key not in by_event_market:
            by_event_market[key] = []
        by_event_market[key].append(opp)

    for key, group in by_event_market.items():
        # Check if we have both sides
        sides = {o.selection: o for o in group}
        for side_a, side_b in [("home", "away"), ("over", "under")]:
            if side_a in sides and side_b in sides:
                oa = sides[side_a]
                ob = sides[side_b]
                dec_a = american_to_decimal(oa.tb_odds)
                dec_b = american_to_decimal(ob.tb_odds)

                # Arb exists if 1/dec_a + 1/dec_b < 1
                implied_sum = (1 / dec_a) + (1 / dec_b)
                if implied_sum < 1:
                    profit = ((1 / implied_sum) - 1) * 100
                    oa.is_arb = True
                    oa.arb_profit = round(profit, 2)
                    ob.is_arb = True
                    ob.arb_profit = round(profit, 2)
                    arbs.append((oa, ob))

    return arbs


def get_latest_tb_snapshots(db_path: str) -> tuple[list[dict], list[dict]]:
    """Get latest TB events and their most recent odds snapshots.

    Returns (events, snapshots) as lists of dicts.
    """
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Get events that have recent snapshots (include all -- TB marks most as "live")
    events = [dict(r) for r in db.execute("""
        SELECT DISTINCT e.*
        FROM events e
        JOIN odds_snapshots o ON o.event_id = e.id
        ORDER BY e.start_time
    """).fetchall()]

    # Get latest snapshot per event+market+selection
    snapshots = [dict(r) for r in db.execute("""
        SELECT o.*
        FROM odds_snapshots o
        INNER JOIN (
            SELECT event_id, market_type, selection, MAX(scraped_at) as max_time
            FROM odds_snapshots
            GROUP BY event_id, market_type, selection
        ) latest ON o.event_id = latest.event_id
            AND o.market_type = latest.market_type
            AND o.selection = latest.selection
            AND o.scraped_at = latest.max_time
    """).fetchall()]

    db.close()
    return events, snapshots


def run_comparison(db_path: str, sharp_events: list[SharpEvent], min_ev: float = 0.0) -> list[Opportunity]:
    """Full comparison pipeline: match events, find +EV opportunities."""
    events, snapshots = get_latest_tb_snapshots(db_path)

    if not events:
        log.warning("No TB events found in database")
        return []

    # Group snapshots by event
    snaps_by_event: dict[str, list[dict]] = {}
    for s in snapshots:
        eid = s["event_id"]
        if eid not in snaps_by_event:
            snaps_by_event[eid] = []
        snaps_by_event[eid].append(s)

    # Match TB events to sharp events
    matched = match_events(events, sharp_events)

    all_opps = []
    for tb_event, sharp_event in matched:
        event_snaps = snaps_by_event.get(tb_event["id"], [])
        opps = find_opportunities(tb_event, event_snaps, sharp_event, min_ev=min_ev)
        all_opps.extend(opps)

    # Sort by EV descending
    all_opps.sort(key=lambda o: o.ev_percent, reverse=True)

    # Check for arbs
    arbs = detect_arbs(all_opps)
    if arbs:
        log.info("Found %d arbitrage opportunities!", len(arbs))

    log.info("Found %d +EV opportunities (min EV: %.1f%%)", len(all_opps), min_ev)
    return all_opps
