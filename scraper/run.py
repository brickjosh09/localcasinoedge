"""Main runner: scrape TB, fetch sharp lines, compare, output results."""

from __future__ import annotations
import asyncio
import json
import logging
import os
import sys

import httpx

from db import get_db, DB_PATH
from scraper import scrape_once
from sharp_lines import fetch_all_sharp_lines, SPORTS
from comparison import run_comparison, american_to_decimal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("runner")


async def full_pipeline(min_ev: float = 0.0, skip_scrape: bool = False):
    """Run the complete pipeline: scrape -> fetch sharp -> compare -> output."""

    # Step 1: Scrape Treasure Bay
    if not skip_scrape:
        log.info("=== Step 1: Scraping Treasure Bay ===")
        async with httpx.AsyncClient() as client:
            stats = await scrape_once(client)
            log.info("TB scrape: %d events, %d snapshots", stats["events"], stats["snapshots"])
    else:
        log.info("=== Step 1: Skipping TB scrape (using cached data) ===")

    # Step 2: Fetch sharp lines
    log.info("=== Step 2: Fetching sharp lines ===")
    # Only fetch for sports TB likely has
    active_sports = [
        "basketball_nba",
        "basketball_ncaab",
        "icehockey_nhl",
        "baseball_mlb",
    ]
    sharp_events = await fetch_all_sharp_lines(active_sports)

    if not sharp_events:
        log.warning("No sharp lines fetched. Check your ODDS_API_KEY.")
        return []

    # Step 3: Compare
    log.info("=== Step 3: Comparing odds ===")
    opps = run_comparison(DB_PATH, sharp_events, min_ev=min_ev)

    # Step 4: Output
    print("\n" + "=" * 80)
    print("  GULFCOAST ODDS -- +EV OPPORTUNITIES")
    print("=" * 80)

    if not opps:
        print("\n  No +EV opportunities found right now.")
        print("  This could mean TB lines are in line with sharp books (no edge).")
    else:
        ev_opps = [o for o in opps if not o.is_arb]
        arb_opps = [o for o in opps if o.is_arb]

        if arb_opps:
            print(f"\n  *** {len(arb_opps)} ARBITRAGE OPPORTUNITIES ***\n")
            seen = set()
            for o in arb_opps:
                key = f"{o.event_name}|{o.market_type}"
                if key in seen:
                    continue
                seen.add(key)
                print(f"  {o.event_name}")
                print(f"    {o.market_type} | Arb profit: {o.arb_profit:.1f}%")
                print()

        print(f"\n  {len(ev_opps)} +EV Bets Found:\n")
        for o in ev_opps[:25]:
            line_str = f" ({o.tb_line:+g})" if o.tb_line else ""
            sharp_line_str = f" ({o.sharp_line:+g})" if o.sharp_line else ""
            print(f"  {o.event_name}")
            print(f"    {o.market_type} {o.selection}{line_str}")
            print(f"    TB: {o.tb_odds:+d} | Sharp ({o.sharp_book}): {o.sharp_odds:+d}{sharp_line_str}")
            print(f"    True prob: {o.true_prob:.1%} | EV: {o.ev_percent:+.1f}%")
            print()

    # Save results as JSON for the web frontend
    results = []
    for o in opps:
        results.append({
            "event": o.event_name,
            "sport": o.sport,
            "start_time": o.start_time,
            "market": o.market_type,
            "selection": o.selection,
            "tb_odds": o.tb_odds,
            "tb_line": o.tb_line,
            "sharp_odds": o.sharp_odds,
            "sharp_book": o.sharp_book,
            "sharp_line": o.sharp_line,
            "true_prob": o.true_prob,
            "ev_percent": o.ev_percent,
            "is_arb": o.is_arb,
            "arb_profit": o.arb_profit,
        })

    output_path = os.path.join(os.path.dirname(__file__), "latest_opportunities.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    log.info("Saved %d opportunities to %s", len(results), output_path)

    return opps


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    min_ev = float(args[0]) if args else 0.0
    skip = "--skip-scrape" in flags
    asyncio.run(full_pipeline(min_ev=min_ev, skip_scrape=skip))
