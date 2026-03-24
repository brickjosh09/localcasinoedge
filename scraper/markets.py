"""Market and casino registry.

A market is a geographic region (typically a state) where local casino
sportsbooks operate. Each market contains one or more casinos, each of
which may have a different platform and scraper configuration.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum


class Platform(Enum):
    IGT_PLAYDIGITAL = "igt_playdigital"   # Treasure Bay, etc -- open cache API
    BETMGM = "betmgm"                     # Beau Rivage
    DRAFTKINGS = "draftkings"             # Golden Nugget Biloxi
    BALLY_BET = "bally_bet"               # Hard Rock Biloxi
    CAESARS = "caesars"                    # Harrah's Gulf Coast
    UNKNOWN = "unknown"


class ScraperStatus(Enum):
    ACTIVE = "active"           # Scraper running and producing data
    COMING_SOON = "coming_soon" # Listed but scraper not built yet
    UNAVAILABLE = "unavailable" # No online odds available


@dataclass
class Casino:
    id: str
    name: str
    short_name: str
    location: str           # City, State
    platform: Platform
    scraper_status: ScraperStatus
    bet_url: str | None = None
    api_base: str | None = None
    notes: str = ""


@dataclass
class Market:
    id: str
    name: str               # "Mississippi Gulf Coast"
    state: str              # "MS"
    region: str             # "Gulf Coast" or "Tunica" etc
    casinos: list[Casino] = field(default_factory=list)

    @property
    def active_casinos(self) -> list[Casino]:
        return [c for c in self.casinos if c.scraper_status == ScraperStatus.ACTIVE]

    @property
    def coming_soon_casinos(self) -> list[Casino]:
        return [c for c in self.casinos if c.scraper_status == ScraperStatus.COMING_SOON]


# ============================================================
# MARKET REGISTRY
# ============================================================

CASINOS = {
    # Mississippi -- Gulf Coast
    "treasure_bay": Casino(
        id="treasure_bay",
        name="Treasure Bay Casino & Hotel",
        short_name="Treasure Bay",
        location="Biloxi, MS",
        platform=Platform.IGT_PLAYDIGITAL,
        scraper_status=ScraperStatus.ACTIVE,
        bet_url="https://bettreasurebay.com",
        api_base="https://bettreasurebay.com/cache",
        notes="IGT PlayDigital platform. Open cache API, no auth required.",
    ),
    "beau_rivage": Casino(
        id="beau_rivage",
        name="Beau Rivage Resort & Casino",
        short_name="Beau Rivage",
        location="Biloxi, MS",
        platform=Platform.BETMGM,
        scraper_status=ScraperStatus.COMING_SOON,
        bet_url="https://beaurivage.mgmresorts.com",
        notes="BetMGM powered. Lines likely mirror national BetMGM. On-property mobile app.",
    ),
    "golden_nugget_biloxi": Casino(
        id="golden_nugget_biloxi",
        name="Golden Nugget Biloxi",
        short_name="Golden Nugget",
        location="Biloxi, MS",
        platform=Platform.DRAFTKINGS,
        scraper_status=ScraperStatus.COMING_SOON,
        bet_url="https://www.goldennugget.com/biloxi/casino/Sportsbook/",
        notes="DraftKings Sportsbook powered. Lines mirror national DK.",
    ),
    "hard_rock_biloxi": Casino(
        id="hard_rock_biloxi",
        name="Hard Rock Hotel & Casino Biloxi",
        short_name="Hard Rock",
        location="Biloxi, MS",
        platform=Platform.BALLY_BET,
        scraper_status=ScraperStatus.COMING_SOON,
        bet_url="https://www.hrhcbiloxi.com/sportsbook.aspx",
        notes="Bally Bet Sportsbook. Lines mirror national Bally.",
    ),
    "harrahs_gulf_coast": Casino(
        id="harrahs_gulf_coast",
        name="Harrah's Gulf Coast",
        short_name="Harrah's",
        location="Biloxi, MS",
        platform=Platform.CAESARS,
        scraper_status=ScraperStatus.COMING_SOON,
        notes="Caesars Sportsbook powered.",
    ),
    "ip_casino": Casino(
        id="ip_casino",
        name="IP Casino Resort Spa",
        short_name="IP Casino",
        location="Biloxi, MS",
        platform=Platform.UNKNOWN,
        scraper_status=ScraperStatus.COMING_SOON,
        notes="Boyd Gaming property. Sportsbook on-site.",
    ),
    "palace_casino": Casino(
        id="palace_casino",
        name="Palace Casino Resort",
        short_name="Palace Casino",
        location="Biloxi, MS",
        platform=Platform.IGT_PLAYDIGITAL,
        scraper_status=ScraperStatus.ACTIVE,
        bet_url="https://sportsbook.palacecasinoresort.com",
        api_base="https://sportsbook.palacecasinoresort.com/cache",
        notes="IGT PlayDigital platform. Same open API as Treasure Bay. More markets (halves, quarters).",
    ),
    "scarlet_pearl": Casino(
        id="scarlet_pearl",
        name="Scarlet Pearl Casino Resort",
        short_name="Scarlet Pearl",
        location="D'Iberville, MS",
        platform=Platform.UNKNOWN,
        scraper_status=ScraperStatus.COMING_SOON,
        notes="Independent property. Sportsbook on-site.",
    ),
    "boomtown_biloxi": Casino(
        id="boomtown_biloxi",
        name="Boomtown Casino Biloxi",
        short_name="Boomtown",
        location="Biloxi, MS",
        platform=Platform.UNKNOWN,
        scraper_status=ScraperStatus.UNAVAILABLE,
        notes="In-person sportsbook only. No online odds available. Penn Entertainment (Boyd Gaming) property.",
    ),
    "island_view": Casino(
        id="island_view",
        name="Island View Casino Resort",
        short_name="Island View",
        location="Gulfport, MS",
        platform=Platform.UNKNOWN,
        scraper_status=ScraperStatus.COMING_SOON,
        notes="Independent property with sportsbook.",
    ),
}

MARKETS = {
    "ms_gulf_coast": Market(
        id="ms_gulf_coast",
        name="Mississippi Gulf Coast",
        state="MS",
        region="Gulf Coast",
        casinos=[
            CASINOS["treasure_bay"],
            CASINOS["palace_casino"],
            CASINOS["beau_rivage"],
            CASINOS["golden_nugget_biloxi"],
            CASINOS["hard_rock_biloxi"],
            CASINOS["harrahs_gulf_coast"],
            CASINOS["ip_casino"],
            CASINOS["boomtown_biloxi"],
            CASINOS["scarlet_pearl"],
            CASINOS["island_view"],
        ],
    ),
    # Future markets:
    # "ms_tunica": Market(id="ms_tunica", name="Mississippi Tunica", state="MS", region="Tunica", ...),
    # "la_new_orleans": Market(id="la_new_orleans", name="Louisiana New Orleans", state="LA", ...),
    # "nv_las_vegas": Market(id="nv_las_vegas", name="Nevada Las Vegas", state="NV", ...),
}


def get_market(market_id: str) -> Market | None:
    return MARKETS.get(market_id)


def get_casino(casino_id: str) -> Casino | None:
    return CASINOS.get(casino_id)


def list_markets() -> list[dict]:
    """Return all markets as dicts for the API."""
    results = []
    for m in MARKETS.values():
        results.append({
            "id": m.id,
            "name": m.name,
            "state": m.state,
            "region": m.region,
            "casino_count": len(m.casinos),
            "active_count": len(m.active_casinos),
            "coming_soon_count": len(m.coming_soon_casinos),
        })
    return results


def list_casinos(market_id: str | None = None) -> list[dict]:
    """Return casinos, optionally filtered by market."""
    if market_id:
        market = MARKETS.get(market_id)
        casino_list = market.casinos if market else []
    else:
        casino_list = list(CASINOS.values())

    return [
        {
            "id": c.id,
            "name": c.name,
            "short_name": c.short_name,
            "location": c.location,
            "platform": c.platform.value,
            "status": c.scraper_status.value,
            "bet_url": c.bet_url,
            "notes": c.notes,
        }
        for c in casino_list
    ]
