"""
Write casino odds to Vercel Postgres (Prisma Postgres).
Replaces SQLite db.py for the production pipeline.
"""
import os
import psycopg2
import psycopg2.extras
from datetime import datetime

POSTGRES_URL = os.environ.get(
    "POSTGRES_URL",
    "postgres://1ff19df6cb44817ca148bb108099dfaf4fd21bd0d5c7e1adc088809858518db4:sk_e6oCVg0pIlbrxGHZBNcdZ@db.prisma.io:5432/postgres?sslmode=require"
)

def get_conn():
    return psycopg2.connect(POSTGRES_URL)

def init_schema():
    """Create tables if they don't exist."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    sport TEXT NOT NULL,
                    home_team TEXT,
                    away_team TEXT,
                    start_time TEXT,
                    casino_id TEXT,
                    last_seen TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS odds_snapshots (
                    id SERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    casino_id TEXT NOT NULL,
                    market TEXT NOT NULL,
                    selection TEXT NOT NULL,
                    odds INTEGER NOT NULL,
                    line NUMERIC,
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sharp_odds (
                    id SERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    sport TEXT NOT NULL,
                    home_team TEXT,
                    away_team TEXT,
                    start_time TEXT,
                    market TEXT NOT NULL,
                    selection TEXT NOT NULL,
                    odds INTEGER NOT NULL,
                    book TEXT NOT NULL,
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            # Indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_event ON odds_snapshots(event_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_time ON odds_snapshots(timestamp)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sharp_event ON sharp_odds(event_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sharp_time ON sharp_odds(timestamp)")
        conn.commit()
    print("Schema initialized.")

def upsert_event(event_id, sport, home_team, away_team, start_time, casino_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (event_id) DO UPDATE
                    SET last_seen = NOW(),
                        start_time = EXCLUDED.start_time
            """, (event_id, sport, home_team, away_team, start_time, casino_id))
        conn.commit()

def insert_snapshot_batch(rows):
    """
    rows: list of (event_id, casino_id, market, selection, odds, line)
    """
    if not rows:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO odds_snapshots (event_id, casino_id, market, selection, odds, line)
                VALUES %s
                """,
                rows
            )
        conn.commit()

def insert_sharp_batch(rows):
    """
    rows: list of (event_id, sport, home_team, away_team, start_time, market, selection, odds, book)
    """
    if not rows:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO sharp_odds (event_id, sport, home_team, away_team, start_time, market, selection, odds, book)
                VALUES %s
                """,
                rows
            )
        conn.commit()

def get_stats():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM events")
            events = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM odds_snapshots")
            snapshots = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM sharp_odds")
            sharp = cur.fetchone()[0]
            cur.execute("SELECT MAX(timestamp) FROM odds_snapshots")
            last = cur.fetchone()[0]
    return {"events": events, "snapshots": snapshots, "sharp": sharp, "last_scrape": last}


if __name__ == "__main__":
    init_schema()
    stats = get_stats()
    print("Stats:", stats)
