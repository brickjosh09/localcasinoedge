import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 30;

export async function GET() {
  try {
    const eventsRes = await sql`SELECT COUNT(*) as count FROM events`;
    const snapshotsRes = await sql`SELECT COUNT(*) as count FROM odds_snapshots`;
    const sportsRes = await sql`SELECT COUNT(DISTINCT sport) as count FROM events`;
    const lastScrapeRes = await sql`SELECT MAX(timestamp) as last FROM odds_snapshots`;

    return NextResponse.json({
      sports_count: parseInt(sportsRes.rows[0]?.count ?? '0'),
      events_count: parseInt(eventsRes.rows[0]?.count ?? '0'),
      snapshots_count: parseInt(snapshotsRes.rows[0]?.count ?? '0'),
      last_scrape_time: lastScrapeRes.rows[0]?.last ?? null,
    });
  } catch {
    return NextResponse.json({ sports_count: 0, events_count: 0, snapshots_count: 0, last_scrape_time: null });
  }
}
