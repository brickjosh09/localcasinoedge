import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 30;

function americanToProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function calcEV(casinoOdds: number, sharpOdds: number): number {
  const trueProb = americanToProb(sharpOdds);
  // EV = prob * payout - (1 - prob)
  const payout = casinoOdds > 0 ? casinoOdds / 100 : 100 / Math.abs(casinoOdds);
  return (trueProb * payout - (1 - trueProb)) * 100;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minEv = parseFloat(searchParams.get('min_ev') ?? '0');
  const sport = searchParams.get('sport');

  try {
    // Get latest snapshot per event+casino+market+selection
    const snapshots = await sql`
      SELECT DISTINCT ON (s.event_id, s.casino_id, s.market, s.selection)
        s.event_id, s.casino_id, s.market, s.selection, s.odds as casino_odds, s.line, s.timestamp,
        e.sport, e.home_team, e.away_team, e.start_time
      FROM odds_snapshots s
      JOIN events e ON e.event_id = s.event_id
      WHERE e.start_time > NOW()
        ${sport ? sql`AND e.sport = ${sport}` : sql``}
      ORDER BY s.event_id, s.casino_id, s.market, s.selection, s.timestamp DESC
    `;

    // Get latest sharp odds per event+market+selection
    const sharpRows = await sql`
      SELECT DISTINCT ON (event_id, market, selection)
        event_id, market, selection, odds as sharp_odds, book
      FROM sharp_odds
      WHERE start_time > NOW()
      ORDER BY event_id, market, selection, timestamp DESC
    `;

    const sharpMap = new Map<string, { sharp_odds: number; book: string }>();
    for (const row of sharpRows.rows) {
      const key = `${row.event_id}:${row.market}:${row.selection}`;
      sharpMap.set(key, { sharp_odds: row.sharp_odds, book: row.book });
    }

    const opportunities = [];
    for (const snap of snapshots.rows) {
      const key = `${snap.event_id}:${snap.market}:${snap.selection}`;
      const sharp = sharpMap.get(key);
      if (!sharp) continue;

      const ev = calcEV(snap.casino_odds, sharp.sharp_odds);
      if (ev < minEv) continue;

      const trueProb = americanToProb(sharp.sharp_odds);
      const eventName = snap.away_team && snap.home_team
        ? `${snap.away_team} @ ${snap.home_team}`
        : snap.event_id;

      opportunities.push({
        event: eventName,
        sport: snap.sport,
        start_time: snap.start_time,
        market: snap.market,
        selection: snap.selection,
        casino_id: snap.casino_id,
        casino_odds: snap.casino_odds,
        line: snap.line,
        sharp_odds: sharp.sharp_odds,
        sharp_book: sharp.book,
        true_prob: Math.round(trueProb * 10000) / 100,
        ev_percent: Math.round(ev * 100) / 100,
        is_arb: false, // TODO: cross-casino arb
      });
    }

    // Sort by EV descending
    opportunities.sort((a, b) => b.ev_percent - a.ev_percent);

    return NextResponse.json(opportunities);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
