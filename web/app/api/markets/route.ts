import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 60;

export async function GET() {
  try {
    const res = await sql`
      SELECT
        e.sport,
        COUNT(DISTINCT e.event_id) as event_count,
        COUNT(DISTINCT e.casino_id) as casino_count,
        MAX(s.timestamp) as last_updated
      FROM events e
      LEFT JOIN odds_snapshots s ON s.event_id = e.event_id
      WHERE e.start_time > NOW()
      GROUP BY e.sport
      ORDER BY event_count DESC
    `;

    const markets = res.rows.map(r => ({
      sport: r.sport,
      label: formatSport(r.sport),
      event_count: parseInt(r.event_count),
      casino_count: parseInt(r.casino_count),
      last_updated: r.last_updated,
      status: 'active',
    }));

    return NextResponse.json({
      markets,
      regions: [
        {
          id: "ms_gulf_coast",
          name: "Mississippi Gulf Coast",
          status: "active",
          casinos: ["treasure_bay", "palace_casino"],
        }
      ]
    });
  } catch {
    return NextResponse.json({ markets: [], regions: [] });
  }
}

function formatSport(key: string): string {
  const map: Record<string, string> = {
    basketball_nba: "NBA Basketball",
    basketball_ncaab: "NCAAB / March Madness",
    icehockey_nhl: "NHL Hockey",
    soccer_usa_mls: "MLS Soccer",
    americanfootball_nfl: "NFL Football",
    americanfootball_ncaaf: "NCAA Football",
    mma_mixed_martial_arts: "MMA",
  };
  return map[key] ?? key;
}
