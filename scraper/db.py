"""Database layer for odds storage (SQLite)."""

import aiosqlite
import os

DB_PATH = os.environ.get(
    "ODDS_DB_PATH",
    os.path.join(os.path.dirname(__file__), "odds.db"),
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS sports (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
    id              TEXT PRIMARY KEY,
    sport_id        TEXT NOT NULL,
    home_team       TEXT,
    away_team       TEXT,
    event_name      TEXT,
    start_time      TEXT,
    is_live         INTEGER DEFAULT 0,
    market_group_id TEXT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sport_id) REFERENCES sports(id)
);

CREATE TABLE IF NOT EXISTS odds_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    TEXT NOT NULL,
    market_type TEXT NOT NULL,          -- moneyline, spread, total
    selection   TEXT NOT NULL,          -- home, away, over, under
    line        REAL,                   -- spread or total value
    odds_american INTEGER NOT NULL,
    odds_decimal  REAL NOT NULL,
    price_up    INTEGER,
    price_down  INTEGER,
    scraped_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_event
    ON odds_snapshots(event_id, scraped_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_time
    ON odds_snapshots(scraped_at);
"""


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.executescript(SCHEMA)
    return db


async def upsert_sport(db: aiosqlite.Connection, sport_id: str, name: str):
    await db.execute(
        """INSERT INTO sports (id, name, updated_at)
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, updated_at=datetime('now')""",
        (sport_id, name),
    )


async def upsert_event(
    db: aiosqlite.Connection,
    event_id: str,
    sport_id: str,
    home_team: str,
    away_team: str,
    event_name: str,
    start_time: str,
    is_live: bool,
    market_group_id: str,
):
    await db.execute(
        """INSERT INTO events (id, sport_id, home_team, away_team, event_name,
                               start_time, is_live, market_group_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
               home_team=excluded.home_team,
               away_team=excluded.away_team,
               event_name=excluded.event_name,
               start_time=excluded.start_time,
               is_live=excluded.is_live,
               market_group_id=excluded.market_group_id,
               updated_at=datetime('now')""",
        (event_id, sport_id, home_team, away_team, event_name,
         start_time, int(is_live), market_group_id),
    )


async def insert_snapshot(
    db: aiosqlite.Connection,
    event_id: str,
    market_type: str,
    selection: str,
    line: float | None,
    odds_american: int,
    odds_decimal: float,
    price_up: int | None,
    price_down: int | None,
):
    await db.execute(
        """INSERT INTO odds_snapshots
           (event_id, market_type, selection, line, odds_american, odds_decimal,
            price_up, price_down, scraped_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        (event_id, market_type, selection, line, odds_american, odds_decimal,
         price_up, price_down),
    )
