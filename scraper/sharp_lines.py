"""Fetch sharp/consensus lines from The Odds API."""

from __future__ import annotations
import asyncio
import logging
import os
from dataclasses import dataclass, field

import httpx

log = logging.getLogger("sharp_lines")

API_KEY = os.environ.get("ODDS_API_KEY", "")
BASE_URL = "https://api.the-odds-api.com/v4"

# Sports we care about (The Odds API sport keys)
SPORTS = [
    "basketball_nba",
    "basketball_ncaab",
    "icehockey_nhl",
    "baseball_mlb",
    "americanfootball_nfl",
    "americanfootball_ncaaf",
    "mma_mixed_martial_arts",
    "soccer_usa_mls",
]

# Sharp books to use as reference lines
SHARP_BOOKS = ["pinnacle", "betonlineag", "betmgm", "draftkings", "fanduel"]
PINNACLE = "pinnacle"  # Primary sharp reference

HEADERS = {"Accept": "application/json"}


@dataclass
class SharpSelection:
    """A single selection from a sharp book."""
    book: str
    price: int          # American odds
    point: float | None = None  # Spread/total line


@dataclass
class SharpMarket:
    """A normalized market from sharp sources."""
    market_type: str    # h2h (moneyline), spreads, totals
    selections: dict[str, list[SharpSelection]] = field(default_factory=dict)
    # selections keyed by outcome label: "home", "away", "over", "under"


@dataclass
class SharpEvent:
    """An event with sharp lines for comparison."""
    event_id: str       # The Odds API event ID
    sport: str
    home_team: str
    away_team: str
    commence_time: str
    markets: list[SharpMarket] = field(default_factory=list)


def _normalize_market_key(key: str) -> str:
    """Map The Odds API market keys to our types."""
    return {"h2h": "moneyline", "spreads": "spread", "totals": "total"}.get(key, key)


def _parse_event(event_data: dict) -> SharpEvent:
    """Parse a single event from The Odds API response."""
    ev = SharpEvent(
        event_id=event_data["id"],
        sport=event_data.get("sport_key", ""),
        home_team=event_data.get("home_team", ""),
        away_team=event_data.get("away_team", ""),
        commence_time=event_data.get("commence_time", ""),
    )

    # Collect markets across bookmakers
    market_data: dict[str, SharpMarket] = {}

    for bookmaker in event_data.get("bookmakers", []):
        book_key = bookmaker.get("key", "")
        if book_key not in SHARP_BOOKS:
            continue

        for mkt in bookmaker.get("markets", []):
            mkt_key = mkt.get("key", "")
            norm_type = _normalize_market_key(mkt_key)

            if norm_type not in market_data:
                market_data[norm_type] = SharpMarket(market_type=norm_type)

            sm = market_data[norm_type]

            for outcome in mkt.get("outcomes", []):
                name = outcome.get("name", "")
                price = outcome.get("price", 0)
                point = outcome.get("point")

                # Determine side
                if norm_type == "total":
                    side = "over" if name.lower() == "over" else "under"
                elif name == ev.home_team:
                    side = "home"
                elif name == ev.away_team:
                    side = "away"
                else:
                    side = name.lower()

                if side not in sm.selections:
                    sm.selections[side] = []

                sm.selections[side].append(SharpSelection(
                    book=book_key,
                    price=price,
                    point=point,
                ))

    ev.markets = list(market_data.values())
    return ev


async def fetch_sport_odds(
    client: httpx.AsyncClient,
    sport: str,
    markets: str = "h2h,spreads,totals",
) -> list[SharpEvent]:
    """Fetch odds for a single sport from The Odds API."""
    if not API_KEY:
        log.error("No ODDS_API_KEY set. Cannot fetch sharp lines.")
        return []

    url = f"{BASE_URL}/sports/{sport}/odds"
    params = {
        "apiKey": API_KEY,
        "regions": "us",
        "markets": markets,
        "oddsFormat": "american",
        "bookmakers": ",".join(SHARP_BOOKS),
    }

    try:
        resp = await client.get(url, params=params, headers=HEADERS, timeout=20)

        # Log remaining requests
        remaining = resp.headers.get("x-requests-remaining", "?")
        used = resp.headers.get("x-requests-used", "?")
        log.info("Odds API [%s]: %s (used: %s, remaining: %s)",
                 sport, resp.status_code, used, remaining)

        resp.raise_for_status()
        data = resp.json()

        events = [_parse_event(ev) for ev in data]
        return events

    except httpx.HTTPStatusError as e:
        log.error("Odds API HTTP %s for %s: %s",
                  e.response.status_code, sport, e.response.text[:200])
        return []
    except Exception as e:
        log.error("Odds API error for %s: %s", sport, e)
        return []


async def fetch_all_sharp_lines(sports: list[str] | None = None) -> list[SharpEvent]:
    """Fetch sharp lines for all configured sports."""
    target_sports = sports or SPORTS
    all_events = []

    async with httpx.AsyncClient() as client:
        for sport in target_sports:
            events = await fetch_sport_odds(client, sport)
            all_events.extend(events)
            if len(target_sports) > 1:
                await asyncio.sleep(0.3)  # Be polite

    log.info("Fetched %d events with sharp lines across %d sports",
             len(all_events), len(target_sports))
    return all_events


def get_no_vig_probability(american_odds: int) -> float:
    """Convert American odds to implied probability (no vig adjustment comes later)."""
    if american_odds > 0:
        return 100 / (american_odds + 100)
    else:
        return abs(american_odds) / (abs(american_odds) + 100)


def calculate_no_vig_line(prices: list[int]) -> list[float]:
    """Given a list of American odds for all outcomes, return no-vig probabilities.

    Removes the overround (vig) by normalizing implied probabilities to sum to 1.
    """
    if not prices:
        return []

    implied = [get_no_vig_probability(p) for p in prices]
    total = sum(implied)

    if total == 0:
        return [0.0] * len(prices)

    return [p / total for p in implied]


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    if not API_KEY:
        print("Set ODDS_API_KEY environment variable first.")
        print("  export ODDS_API_KEY=your_key_here")
        sys.exit(1)

    async def main():
        # Test with just NBA
        events = await fetch_all_sharp_lines(["basketball_nba"])
        for ev in events[:3]:
            print(f"\n{ev.away_team} @ {ev.home_team} ({ev.commence_time})")
            for mkt in ev.markets:
                print(f"  {mkt.market_type}:")
                for side, sels in mkt.selections.items():
                    pinnacle_sel = next((s for s in sels if s.book == PINNACLE), None)
                    if pinnacle_sel:
                        print(f"    {side}: {pinnacle_sel.price:+d} (Pinnacle)"
                              + (f" [{pinnacle_sel.point}]" if pinnacle_sel.point else ""))

    asyncio.run(main())
