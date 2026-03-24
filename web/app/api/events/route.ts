import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get('sport');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  try {
    const events = sport
      ? await sql`
          SELECT e.event_id, e.sport, e.home_team, e.away_team, e.start_time,
            json_agg(json_build_object(
              'market', s.market,
              'selection', s.selection,
              'casino_id', s.casino_id,
              'odds', s.odds,
              'line', s.line
            )) as markets
          FROM events e
          LEFT JOIN LATERAL (
            SELECT DISTINCT ON (market, selection, casino_id) market, selection, casino_id, odds, line
            FROM odds_snapshots
            WHERE event_id = e.event_id
            ORDER BY market, selection, casino_id, timestamp DESC
          ) s ON true
          WHERE e.start_time > NOW() AND e.sport = ${sport}
          GROUP BY e.event_id
          ORDER BY e.start_time ASC
          LIMIT ${limit}
        `
      : await sql`
          SELECT e.event_id, e.sport, e.home_team, e.away_team, e.start_time,
            json_agg(json_build_object(
              'market', s.market,
              'selection', s.selection,
              'casino_id', s.casino_id,
              'odds', s.odds,
              'line', s.line
            )) as markets
          FROM events e
          LEFT JOIN LATERAL (
            SELECT DISTINCT ON (market, selection, casino_id) market, selection, casino_id, odds, line
            FROM odds_snapshots
            WHERE event_id = e.event_id
            ORDER BY market, selection, casino_id, timestamp DESC
          ) s ON true
          WHERE e.start_time > NOW()
          GROUP BY e.event_id
          ORDER BY e.start_time ASC
          LIMIT ${limit}
        `;

    const formatted = events.rows.map(e => ({
      event_id: e.event_id,
      event: e.away_team && e.home_team ? `${e.away_team} @ ${e.home_team}` : e.event_id,
      sport: e.sport,
      start_time: e.start_time,
      markets: e.markets?.filter(Boolean) ?? [],
    }));

    return NextResponse.json(formatted);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
