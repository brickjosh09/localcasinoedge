import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

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

// Casino ID -> display name mapping
const CASINO_NAMES: Record<string, string> = {
  treasure_bay: 'Treasure Bay',
  palace_casino: 'Palace Casino',
};

async function getCasinoNames(): Promise<Record<string, string>> {
  try {
    const res = await query('SELECT id, name FROM casinos');
    const map: Record<string, string> = { ...CASINO_NAMES };
    for (const row of res.rows as { id: string; name: string }[]) {
      map[row.id] = row.name;
    }
    return map;
  } catch {
    return CASINO_NAMES;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minEv = parseFloat(searchParams.get('min_ev') ?? '0');
  const sport = searchParams.get('sport');

  try {
    const casinoNames = await getCasinoNames();
    const queryText = `
      SELECT
        s.event_id as casino_event_id,
        s.casino_id,
        s.market,
        s.selection as casino_selection,
        s.odds as casino_odds,
        s.line,
        e.sport,
        e.home_team,
        e.away_team,
        e.start_time,
        sh.odds as sharp_odds,
        sh.book as sharp_book,
        sh.selection as sharp_side
      FROM (
        SELECT DISTINCT ON (event_id, casino_id, market, selection)
          event_id, casino_id, market, selection, odds, line, timestamp
        FROM odds_snapshots
        ORDER BY event_id, casino_id, market, selection, timestamp DESC
      ) s
      JOIN events e ON e.event_id = s.event_id
      JOIN (
        SELECT DISTINCT ON (home_team, away_team, market, selection)
          home_team, away_team, market, selection, odds, book,
          CASE WHEN selection = 'home' THEN home_team ELSE away_team END as team_name
        FROM sharp_odds
        WHERE start_time::timestamptz > NOW()
        ORDER BY home_team, away_team, market, selection, timestamp DESC
      ) sh ON sh.home_team = e.home_team
          AND sh.away_team = e.away_team
          AND sh.market = s.market
          AND sh.team_name = s.selection
      WHERE e.start_time::timestamptz > NOW()
        ${sport ? `AND e.sport = $1` : ''}
      ORDER BY e.start_time ASC
    `;

    const params = sport ? [sport] : [];
    const rows = await query(queryText, params);

    const opportunities = [];
    for (const row of rows.rows as Record<string, unknown>[]) {
      const casinoOdds = Number(row.casino_odds);
      const sharpOdds = Number(row.sharp_odds);
      const ev = calcEV(casinoOdds, sharpOdds);
      if (ev < minEv) continue;

      const trueProb = americanToProb(sharpOdds);
      const eventName = `${row.away_team} @ ${row.home_team}`;

      // true_prob as a 0-1 fraction (frontend formatProb does *100)
      const isArb = ev >= 100;
      const arbProfit = isArb
        ? (1 / americanToProb(casinoOdds) + 1 / americanToProb(sharpOdds) < 1
            ? (1 - (americanToProb(casinoOdds) + americanToProb(sharpOdds))) * 100
            : 0)
        : 0;

      const casinoId = String(row.casino_id);
      opportunities.push({
        event: eventName,
        sport: row.sport,
        start_time: row.start_time,
        market: row.market,
        selection: row.casino_selection,
        casino_id: casinoId,
        casino_name: casinoNames[casinoId] || casinoId,
        tb_odds: casinoOdds,
        tb_line: row.line !== null && row.line !== undefined ? Number(row.line) : null,
        sharp_odds: sharpOdds,
        sharp_book: row.sharp_book,
        sharp_line: null,
        true_prob: trueProb,
        ev_percent: Math.round(ev * 100) / 100,
        is_arb: isArb,
        arb_profit: Math.round(arbProfit * 100) / 100,
      });
    }

    opportunities.sort((a, b) => b.ev_percent - a.ev_percent);

    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
