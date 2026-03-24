import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 30;

function americanToProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function calcEV(casinoOdds: number, sharpOdds: number): number {
  const trueProb = americanToProb(sharpOdds);
  const payout = casinoOdds > 0 ? casinoOdds / 100 : 100 / Math.abs(casinoOdds);
  return (trueProb * payout - (1 - trueProb)) * 100;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minEv = parseFloat(searchParams.get('min_ev') ?? '0');
  const sport = searchParams.get('sport');

  try {
    // Join casino snapshots to sharp odds by matching team names + same day
    // Casino event IDs differ from sharp line IDs, so we match on home_team + away_team + date
    const rows = await sql`
      SELECT
        s.event_id as casino_event_id,
        s.casino_id,
        s.market,
        s.selection,
        s.odds as casino_odds,
        s.line,
        s.timestamp as snap_time,
        e.sport,
        e.home_team,
        e.away_team,
        e.start_time,
        sh.odds as sharp_odds,
        sh.book as sharp_book
      FROM (
        SELECT DISTINCT ON (event_id, casino_id, market, selection)
          event_id, casino_id, market, selection, odds, line, timestamp
        FROM odds_snapshots
        ORDER BY event_id, casino_id, market, selection, timestamp DESC
      ) s
      JOIN events e ON e.event_id = s.event_id
      JOIN (
        SELECT DISTINCT ON (home_team, away_team, market, selection)
          home_team, away_team, market, selection, odds, book, start_time
        FROM sharp_odds
        WHERE start_time > NOW()
        ORDER BY home_team, away_team, market, selection, timestamp DESC
      ) sh ON sh.home_team = e.home_team
          AND sh.away_team = e.away_team
          AND sh.market = s.market
          AND sh.selection = s.selection
      WHERE e.start_time > NOW()
        ${sport ? sql`AND e.sport = ${sport}` : sql``}
      ORDER BY s.timestamp DESC
    `;

    const opportunities = [];
    for (const row of rows.rows) {
      const ev = calcEV(row.casino_odds, row.sharp_odds);
      if (ev < minEv) continue;

      const trueProb = americanToProb(row.sharp_odds);
      const eventName = `${row.away_team} @ ${row.home_team}`;

      opportunities.push({
        event: eventName,
        sport: row.sport,
        start_time: row.start_time,
        market: row.market,
        selection: row.selection,
        casino_id: row.casino_id,
        casino_odds: row.casino_odds,
        line: row.line,
        sharp_odds: row.sharp_odds,
        sharp_book: row.sharp_book,
        true_prob: Math.round(trueProb * 10000) / 100,
        ev_percent: Math.round(ev * 100) / 100,
        is_arb: false,
      });
    }

    // Sort by EV descending
    opportunities.sort((a, b) => b.ev_percent - a.ev_percent);

    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
