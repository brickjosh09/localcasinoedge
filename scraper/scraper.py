"""
IGT PlayDigital scraper for MS Gulf Coast casinos.
Writes to both local SQLite (for backwards compat) and Vercel Postgres (production).
"""
import asyncio
import httpx
import json
import time
from datetime import datetime

import db
import pg_writer
from markets import CASINOS
from parser import parse_nav_tree, parse_market_group

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LocalCasinoEdge/1.0)"}
DELAY = 0.3  # seconds between requests


async def scrape_casino(client: httpx.AsyncClient, casino: dict) -> int:
    """Scrape one casino. Returns number of snapshots saved."""
    cid = casino["id"]
    base = casino["url"].rstrip("/")
    print(f"\n[{cid}] Starting scrape...")

    try:
        r = await client.get(f"{base}/cache/psbonav/1/UK/top.json", headers=HEADERS, timeout=15)
        r.raise_for_status()
        nav_data = r.json()
    except Exception as e:
        print(f"[{cid}] Nav fetch failed: {e}")
        return 0

    group_ids = parse_nav_tree(nav_data)
    print(f"[{cid}] Found {len(group_ids)} market groups")

    total = 0
    pg_event_batch = []
    pg_snapshot_batch = []

    for i, gid in enumerate(group_ids):
        try:
            r = await client.get(f"{base}/cache/psmg/1/UK/{gid}.json", headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue
            mg_data = r.json()
        except Exception:
            continue

        events = parse_market_group(mg_data)
        for event in events:
            # Fields from parser.parse_market_group()
            raw_eid = event.get("event_id") or event.get("id")
            if not raw_eid:
                continue
            eid = f"{cid}:{raw_eid}"
            sport = event.get("sport", "unknown")
            home = event.get("home_team") or event.get("home") or ""
            away = event.get("away_team") or event.get("away") or ""
            start = event.get("start_time") or event.get("start") or ""

            # SQLite
            try:
                db.save_event(eid, sport, home, away, start, cid)
            except Exception:
                pass

            pg_event_batch.append((eid, sport, home, away, start, cid))

            # Odds/snapshots
            odds_list = event.get("odds") or event.get("markets") or event.get("selections") or []
            for snap in odds_list:
                market = snap.get("market") or snap.get("market_type") or snap.get("type") or ""
                selection = snap.get("selection") or snap.get("name") or ""
                american = snap.get("odds") or snap.get("american_odds") or snap.get("price") or 0
                line = snap.get("line") or snap.get("handicap") or None

                if not market or not selection or not american:
                    continue

                # SQLite
                try:
                    db.save_snapshot(eid, cid, market, selection, int(american), line)
                except Exception:
                    pass

                pg_snapshot_batch.append((eid, cid, market, selection, int(american), line))
                total += 1

        # Flush Postgres every 200 snapshot rows
        if len(pg_snapshot_batch) >= 200:
            try:
                # Upsert events first
                with pg_writer.get_conn() as conn:
                    import psycopg2.extras
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
                print(f"[{cid}] Flushed batch at group {i+1}/{len(group_ids)}, total={total}")
            except Exception as e:
                print(f"[{cid}] Postgres batch flush error: {e}")

        await asyncio.sleep(DELAY)

    # Final flush
    if pg_event_batch or pg_snapshot_batch:
        try:
            import psycopg2.extras
            with pg_writer.get_conn() as conn:
                with conn.cursor() as cur:
                    if pg_event_batch:
                        psycopg2.extras.execute_values(cur, """
                            INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
                            VALUES %s
                            ON CONFLICT (event_id) DO UPDATE SET last_seen = NOW()
                        """, pg_event_batch)
                conn.commit()
            pg_event_batch.clear()

            if pg_snapshot_batch:
                pg_writer.insert_snapshot_batch(pg_snapshot_batch)
            pg_snapshot_batch.clear()
            print(f"[{cid}] Final flush done")
        except Exception as e:
            print(f"[{cid}] Postgres final flush error: {e}")

    print(f"[{cid}] Done. {total} snapshots saved.")
    return total


async def main():
    pg_writer.init_schema()

    active = [c for c in CASINOS if c.get("status") == "active"]
    print(f"Scraping {len(active)} active casinos: {[c['id'] for c in active]}")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        for casino in active:
            await scrape_casino(client, casino)

    stats = pg_writer.get_stats()
    print(f"\nPostgres stats: {stats}")


if __name__ == "__main__":
    asyncio.run(main())
