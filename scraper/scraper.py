"""
IGT PlayDigital scraper for MS Gulf Coast casinos.
Writes to both local SQLite (for backwards compat) and Vercel Postgres (production).
"""
import asyncio
import httpx
import psycopg2.extras

import db
import pg_writer
from markets import CASINOS
from parser import parse_nav_tree, parse_market_group

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LocalCasinoEdge/1.0)"}
DELAY = 0.3  # seconds between requests


async def scrape_casino(client: httpx.AsyncClient, casino) -> int:
    """Scrape one casino. Returns number of snapshots saved."""
    cid = casino.id
    base = casino.bet_url.rstrip("/")
    print(f"\n[{cid}] Starting scrape: {base}")

    try:
        r = await client.get(f"{base}/cache/psbonav/1/UK/top.json", headers=HEADERS, timeout=15)
        r.raise_for_status()
        nav_data = r.json()
    except Exception as e:
        print(f"[{cid}] Nav fetch failed: {e}")
        return 0

    # parse_nav_tree returns list of dicts: {id, name, market_group_id, category}
    group_list = parse_nav_tree(nav_data)
    print(f"[{cid}] Found {len(group_list)} market groups")

    total = 0
    pg_event_batch = []
    pg_snapshot_batch = []

    for i, mg_info in enumerate(group_list):
        mg_id = mg_info["market_group_id"]
        sport_name = mg_info["name"]
        sport_id = mg_info["id"]

        try:
            r = await client.get(f"{base}/cache/psmg/1/UK/{mg_id}.json", headers=HEADERS, timeout=10)
            if r.status_code != 200 or not r.content.strip():
                continue
            mg_data = r.json()
        except Exception:
            continue

        # parse_market_group returns list of Event dataclasses
        events = parse_market_group(mg_data, sport_id, sport_name, mg_id)
        for event in events:
            eid = f"{cid}:{event.event_id}"
            sport = event.sport_name
            home = event.home_team
            away = event.away_team
            start = event.start_time

            # SQLite
            try:
                db.save_event(eid, sport, home, away, start, cid)
            except Exception:
                pass

            pg_event_batch.append((eid, sport, home, away, start, cid))

            for market in event.markets:
                for sel in market.selections:
                    odds = sel.odds_american
                    line = sel.handicap
                    selection_name = sel.name
                    market_type = market.market_type

                    if not odds:
                        continue

                    # SQLite
                    try:
                        db.save_snapshot(eid, cid, market_type, selection_name, odds, line)
                    except Exception:
                        pass

                    pg_snapshot_batch.append((eid, cid, market_type, selection_name, odds, line))
                    total += 1

        # Flush Postgres every 200 snapshot rows
        if len(pg_snapshot_batch) >= 200:
            try:
                with pg_writer.get_conn() as conn:
                    with conn.cursor() as cur:
                        psycopg2.extras.execute_values(cur, """
                            INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
                            VALUES %s
                            ON CONFLICT (event_id) DO UPDATE SET last_seen = NOW()
                        """, pg_event_batch)
                    conn.commit()
                pg_event_batch.clear()
                pg_writer.insert_snapshot_batch(pg_snapshot_batch)
                pg_snapshot_batch.clear()
                print(f"[{cid}] Flushed batch at group {i+1}/{len(group_list)}, total={total}")
            except Exception as e:
                print(f"[{cid}] Postgres batch flush error: {e}")

        await asyncio.sleep(DELAY)

    # Final flush
    try:
        with pg_writer.get_conn() as conn:
            with conn.cursor() as cur:
                if pg_event_batch:
                    psycopg2.extras.execute_values(cur, """
                        INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
                        VALUES %s
                        ON CONFLICT (event_id) DO UPDATE SET last_seen = NOW()
                    """, pg_event_batch)
            conn.commit()
        if pg_snapshot_batch:
            pg_writer.insert_snapshot_batch(pg_snapshot_batch)
        print(f"[{cid}] Final flush done. Total snapshots: {total}")
    except Exception as e:
        print(f"[{cid}] Postgres final flush error: {e}")

    return total


async def main():
    pg_writer.init_schema()

    # CASINOS is a dict keyed by casino id
    all_casinos = list(CASINOS.values()) if isinstance(CASINOS, dict) else CASINOS
    active = [c for c in all_casinos if hasattr(c, 'scraper_status') and c.scraper_status.value == 'active']
    print(f"Scraping {len(active)} active casinos: {[c.id for c in active]}")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        for casino in active:
            await scrape_casino(client, casino)

    stats = pg_writer.get_stats()
    print(f"\nPostgres stats: {stats}")


if __name__ == "__main__":
    asyncio.run(main())
