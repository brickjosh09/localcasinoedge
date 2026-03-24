import { sql } from '@vercel/postgres';

export { sql };

// Initialize tables if they don't exist
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      sport TEXT NOT NULL,
      home_team TEXT,
      away_team TEXT,
      start_time TIMESTAMPTZ,
      casino_id TEXT NOT NULL,
      last_seen TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS odds_snapshots (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(event_id),
      casino_id TEXT NOT NULL,
      market TEXT NOT NULL,
      selection TEXT NOT NULL,
      odds INTEGER NOT NULL,
      line NUMERIC,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sharp_odds (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL,
      sport TEXT NOT NULL,
      home_team TEXT,
      away_team TEXT,
      start_time TIMESTAMPTZ,
      market TEXT NOT NULL,
      selection TEXT NOT NULL,
      odds INTEGER NOT NULL,
      book TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_snapshots_event ON odds_snapshots(event_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sharp_event ON sharp_odds(event_id)
  `;
}
