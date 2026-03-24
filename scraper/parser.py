"""Parse Treasure Bay JSON responses into normalized odds data."""

from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Selection:
    name: str           # e.g. "Los Angeles Lakers", "Over", "Under"
    side: str           # home, away, over, under, draw
    price_up: int
    price_down: int
    odds_decimal: float
    odds_american: int
    handicap: float | None = None   # spread or total line


@dataclass
class Market:
    market_type: str    # moneyline, spread, total
    selections: list[Selection] = field(default_factory=list)


@dataclass
class Event:
    event_id: str
    sport_id: str
    sport_name: str
    home_team: str
    away_team: str
    event_name: str
    start_time: str
    is_live: bool
    market_group_id: str
    markets: list[Market] = field(default_factory=list)


def decimal_to_american(dec: float) -> int:
    """Convert decimal odds to American."""
    if dec >= 2.0:
        return round((dec - 1) * 100)
    elif dec > 1.0:
        return round(-100 / (dec - 1))
    return 0


def parse_odds(price_up: int, price_down: int) -> tuple[float, int]:
    """Return (decimal, american) from fractional components."""
    if price_down == 0:
        return (0.0, 0)
    decimal = (price_up / price_down) + 1
    american = decimal_to_american(decimal)
    return (round(decimal, 4), american)


def classify_market(market_name: str) -> str:
    """Map Treasure Bay market names to our normalized types."""
    name = market_name.lower()
    if "money" in name or "moneyline" in name or "match result" in name or "to win" in name:
        return "moneyline"
    if "spread" in name or "handicap" in name or "point spread" in name:
        return "spread"
    if "total" in name or "over" in name:
        return "total"
    return name  # pass through unknown types


def classify_selection_side(sel_name: str, market_type: str, is_home: bool | None = None) -> str:
    """Determine if a selection is home/away/over/under."""
    lower = sel_name.lower()
    if market_type == "total":
        if "over" in lower:
            return "over"
        if "under" in lower:
            return "under"
        return lower
    if "draw" in lower or "tie" in lower:
        return "draw"
    # For spread/moneyline, rely on position (first = away, second = home in typical layout)
    # But we'll use is_home if provided
    if is_home is True:
        return "home"
    if is_home is False:
        return "away"
    return lower


def parse_nav_tree(data: dict) -> list[dict]:
    """Parse the Treasure Bay navigation tree JSON.

    Structure: top-level has 'bonavigationnodes' containing sport categories.
    Each node can have nested 'bonavigationnodes' (sub-categories) and
    'marketgroups' (list of dicts with 'idfwmarketgroup' and 'name').

    Returns list of dicts: {id, name, market_group_id, category}
    """
    results = []

    def walk(node, sport_name=None):
        name = node.get("name", node.get("n", ""))
        node_id = str(node.get("idfwbonavigation", node.get("id", "")))
        top_sport = sport_name or name

        # Collect market groups at this level
        for mg in node.get("marketgroups", []):
            mg_id = mg.get("idfwmarketgroup")
            if mg_id:
                results.append({
                    "id": node_id,
                    "name": top_sport,
                    "market_group_id": str(mg_id),
                    "category": name,
                })

        # Recurse into child navigation nodes
        for child in node.get("bonavigationnodes", []):
            walk(child, sport_name=top_sport)

    # Top level: dict with 'bonavigationnodes'
    top_nodes = []
    if isinstance(data, dict):
        top_nodes = data.get("bonavigationnodes", [])
    elif isinstance(data, list):
        top_nodes = data

    for node in top_nodes:
        walk(node)

    return results


def parse_market_group(data: dict, sport_id: str, sport_name: str, market_group_id: str) -> list[Event]:
    """Parse a Treasure Bay market group response into a list of Events with odds.

    Expected structure:
    {
        "events": [ { "idfoevent", "participantname_home", "participantname_away",
                       "externaldescription", "tsstart", "islive",
                       "markets": [ { "name", "selections": [ { "name",
                           "currentpriceup", "currentpricedown", "currenthandicap" } ] } ] } ],
        "idfwmarketgroup": ...,
        "marketgroupname": ...
    }
    """
    events = []

    event_list = data.get("events", []) if isinstance(data, dict) else []

    for ev_data in event_list:
        if not isinstance(ev_data, dict):
            continue

        event_id = str(ev_data.get("idfoevent", ""))
        if not event_id:
            continue

        home = ev_data.get("participantname_home", "")
        away = ev_data.get("participantname_away", "")
        event_name = ev_data.get("externaldescription", ev_data.get("eventname", f"{away} @ {home}"))
        start_time = ev_data.get("tsstart", "")
        is_live = bool(ev_data.get("islive", False))

        event = Event(
            event_id=event_id,
            sport_id=sport_id,
            sport_name=sport_name,
            home_team=home,
            away_team=away,
            event_name=event_name,
            start_time=str(start_time),
            is_live=is_live,
            market_group_id=market_group_id,
        )

        for mkt in ev_data.get("markets", []):
            if not isinstance(mkt, dict):
                continue

            market_name = mkt.get("name", "")
            market_type = classify_market(market_name)
            market = Market(market_type=market_type)

            selections_data = mkt.get("selections", [])

            for i, sel in enumerate(selections_data):
                if not isinstance(sel, dict):
                    continue

                sel_name = sel.get("name", "")
                price_up = float(sel.get("currentpriceup", 0))
                price_down = float(sel.get("currentpricedown", 0))
                handicap_raw = sel.get("currenthandicap", None)

                handicap = None
                if handicap_raw is not None:
                    try:
                        handicap = float(handicap_raw)
                    except (ValueError, TypeError):
                        pass

                odds_decimal, odds_american = parse_odds(int(price_up), int(price_down))
                if odds_decimal == 0:
                    continue

                # Determine side
                is_home = None
                if market_type in ("moneyline", "spread"):
                    if home and sel_name and home.lower() in sel_name.lower():
                        is_home = True
                    elif away and sel_name and away.lower() in sel_name.lower():
                        is_home = False
                    else:
                        is_home = (i == 1) if len(selections_data) == 2 else None

                side = classify_selection_side(sel_name, market_type, is_home)

                market.selections.append(Selection(
                    name=sel_name,
                    side=side,
                    price_up=int(price_up),
                    price_down=int(price_down),
                    odds_decimal=odds_decimal,
                    odds_american=odds_american,
                    handicap=handicap,
                ))

            if market.selections:
                event.markets.append(market)

        if event.markets:
            events.append(event)

    return events
