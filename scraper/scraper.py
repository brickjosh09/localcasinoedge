"""Treasure Bay odds scraper -- fetches and stores odds data."""

from __future__ import annotations
import asyncio
import json
import logging
import sys
import time

import httpx

from db import get_db, upsert_sport, upsert_event, insert_snapshot
from parser import parse_nav_tree, parse_market_group

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scraper")

# Multi-casino support: each IGT PlayDigital casino has the same API pattern
IGT_CASINOS = {
    "treasure_bay": {
        "name": "Treasure Bay",
        "base_url": "https://bettreasurebay.com/cache",
    },
    "palace_casino": {
        "name": "Palace Casino",
        "base_url": "https://sportsbook.palacecasinoresort.com/cache",
    },
}

# Legacy defaults (used if calling scrape_once without casino_id)
BASE_URL = "https://bettreasurebay.com/cache"
NAV_URL = f"{BASE_URL}/psbonav/1/UK/top.json"
MG_URL_TPL = f"{BASE_URL}/psmg/1/UK/{{mg_id}}.json"

# Polite delays between requests
REQUEST_DELAY = 0.5  # seconds between market group fetches
POLL_INTERVAL = 120  # seconds between full scrape cycles (2 min)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://bettreasurebay.com/",
}


async def fetch_json(client: httpx.AsyncClient, url: str) -> dict | list | None:
    """Fetch JSON from a URL, return parsed data or None on error."""
    try:
        resp = await client.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        log.warning("HTTP %s for %s", e.response.status_code, url)
        return None
    except Exception as e:
        log.warning("Error fetching %s: %s", url, e)
        return None


async def scrape_once(client: httpx.AsyncClient, casino_id: str | None = None) -> dict:
    """Run a single scrape cycle for a given casino. Returns stats dict."""
    stats = {"sports": 0, "events": 0, "snapshots": 0, "errors": 0, "casino": casino_id or "treasure_bay"}

    # Determine which casino to scrape
    casino = IGT_CASINOS.get(casino_id or "treasure_bay", IGT_CASINOS["treasure_bay"])
    base = casino["base_url"]
    nav_url = f"{base}/psbonav/1/UK/top.json"
    mg_url_tpl = f"{base}/psmg/1/UK/{{mg_id}}.json"

    # 1. Fetch nav tree
    log.info("Fetching navigation tree for %s...", casino["name"])
    nav_data = await fetch_json(client, nav_url)
    if nav_data is None:
        log.error("Failed to fetch nav tree. Skipping cycle.")
        stats["errors"] += 1
        return stats

    sport_entries = parse_nav_tree(nav_data)
    log.info("Found %d sport/category entries", len(sport_entries))

    if not sport_entries:
        # Dump raw nav for debugging
        log.warning("Nav tree parsed to 0 entries. Raw keys: %s",
                     list(nav_data.keys()) if isinstance(nav_data, dict) else type(nav_data))
        # Save for debug
        with open("debug_nav.json", "w") as f:
            json.dump(nav_data, f, indent=2)
        log.info("Saved raw nav to debug_nav.json")
        return stats

    db = await get_db()

    try:
        for entry in sport_entries:
            sport_id = entry["id"]
            sport_name = entry["name"]
            mg_id = entry["market_group_id"]

            await upsert_sport(db, sport_id, sport_name)
            stats["sports"] += 1

            # 2. Fetch market group odds
            mg_url = mg_url_tpl.format(mg_id=mg_id)
            mg_data = await fetch_json(client, mg_url)

            if mg_data is None:
                stats["errors"] += 1
                await asyncio.sleep(REQUEST_DELAY)
                continue

            # 3. Parse events and odds
            events = parse_market_group(mg_data, sport_id, sport_name, mg_id)

            for event in events:
                await upsert_event(
                    db,
                    event_id=event.event_id,
                    sport_id=event.sport_id,
                    home_team=event.home_team,
                    away_team=event.away_team,
                    event_name=event.event_name,
                    start_time=event.start_time,
                    is_live=event.is_live,
                    market_group_id=event.market_group_id,
                )
                stats["events"] += 1

                for market in event.markets:
                    for sel in market.selections:
                        await insert_snapshot(
                            db,
                            event_id=event.event_id,
                            market_type=market.market_type,
                            selection=sel.side,
                            line=sel.handicap,
                            odds_american=sel.odds_american,
                            odds_decimal=sel.odds_decimal,
                            price_up=sel.price_up,
                            price_down=sel.price_down,
                        )
                        stats["snapshots"] += 1

            await asyncio.sleep(REQUEST_DELAY)

        await db.commit()
    finally:
        await db.close()

    return stats


async def run_loop():
    """Run the scraper in a polling loop for all configured casinos."""
    log.info("Starting multi-casino scraper (poll every %ds)...", POLL_INTERVAL)

    async with httpx.AsyncClient() as client:
        while True:
            t0 = time.monotonic()
            total_stats = {"sports": 0, "events": 0, "snapshots": 0, "errors": 0}
            for casino_id in IGT_CASINOS:
                try:
                    stats = await scrape_once(client, casino_id)
                    for k in ("sports", "events", "snapshots", "errors"):
                        total_stats[k] += stats[k]
                except Exception:
                    log.exception("Error scraping %s", casino_id)
                    total_stats["errors"] += 1
            elapsed = time.monotonic() - t0
            log.info(
                "Full cycle done in %.1fs -- %d sports, %d events, %d snapshots, %d errors",
                elapsed, total_stats["sports"], total_stats["events"],
                total_stats["snapshots"], total_stats["errors"],
            )
            await asyncio.sleep(POLL_INTERVAL)


async def run_once(casino_id: str | None = None):
    """Run a single scrape (for testing). If no casino_id, scrape all."""
    async with httpx.AsyncClient() as client:
        if casino_id:
            stats = await scrape_once(client, casino_id)
            log.info("Single run complete (%s): %s", casino_id, stats)
            return stats
        else:
            all_stats = {}
            for cid in IGT_CASINOS:
                stats = await scrape_once(client, cid)
                all_stats[cid] = stats
                log.info("Scraped %s: %d events, %d snapshots",
                         cid, stats["events"], stats["snapshots"])
            return all_stats


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    mode = args[0] if args else "once"
    casino = args[1] if len(args) > 1 else None
    if mode == "loop":
        asyncio.run(run_loop())
    else:
        asyncio.run(run_once(casino))
