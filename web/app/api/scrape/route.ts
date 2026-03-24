import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDb } from '../../lib/db';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const SCRAPE_SECRET = process.env.SCRAPE_SECRET;

// In-season sports only (late March - reduce API credits)
const SPORTS = [
  'basketball_nba',
  'basketball_ncaab',
  'icehockey_nhl',
  'soccer_usa_mls',
];

// Sharp reference books
const SHARP_BOOKS = ['pinnacle', 'betonlineag', 'draftkings', 'fanduel'];

interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsBookmaker {
  key: string;
  markets: Array<{
    key: string;
    outcomes: OddsOutcome[];
  }>;
}

interface OddsEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsBookmaker[];
}

async function fetchSharpOdds(sport: string): Promise<OddsEvent[]> {
  if (!ODDS_API_KEY) return [];
  const books = SHARP_BOOKS.join(',');
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&bookmakers=${books}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

// Simple IGT scraper for a casino
async function scrapeCasino(casinoId: string, baseUrl: string): Promise<Array<{
  eventId: string; sport: string; homeTeam: string; awayTeam: string;
  startTime: string; market: string; selection: string; odds: number; line: number | null;
}>> {
  const results: Array<{
    eventId: string; sport: string; homeTeam: string; awayTeam: string;
    startTime: string; market: string; selection: string; odds: number; line: number | null;
  }> = [];

  try {
    const navRes = await fetch(`${baseUrl}/cache/psbonav/1/UK/top.json`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!navRes.ok) return results;
    const nav = await navRes.json();

    const groups: string[] = [];
    function extractGroups(node: unknown) {
      if (!node || typeof node !== 'object') return;
      const obj = node as Record<string, unknown>;
      if (obj.id && obj.url) groups.push(obj.id as string);
      if (Array.isArray(obj.children)) obj.children.forEach(extractGroups);
      if (Array.isArray(obj.items)) obj.items.forEach(extractGroups);
    }
    extractGroups(nav);

    // Limit to first 50 groups per scrape to avoid timeout
    const toScrape = groups.slice(0, 50);

    for (const groupId of toScrape) {
      try {
        const mgRes = await fetch(`${baseUrl}/cache/psmg/1/UK/${groupId}.json`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!mgRes.ok) continue;
        const mg = await mgRes.json();

        const events = mg.events ?? mg.data?.events ?? [];
        for (const event of events) {
          const eventId = `${casinoId}:${event.id}`;
          const sport = detectSport(event.competition?.name ?? '');
          if (!sport) continue;

          for (const market of (event.markets ?? [])) {
            const marketKey = normalizeMarket(market.name ?? '');
            if (!marketKey) continue;
            for (const sel of (market.selections ?? [])) {
              const odds = parseOdds(sel.price);
              if (!odds) continue;
              results.push({
                eventId,
                sport,
                homeTeam: event.homeTeam?.name ?? '',
                awayTeam: event.awayTeam?.name ?? '',
                startTime: event.startTime ?? event.start_time ?? '',
                market: marketKey,
                selection: sel.name ?? '',
                odds,
                line: sel.handicap ?? null,
              });
            }
          }
        }
      } catch { /* skip failed groups */ }
    }
  } catch { /* scrape failed */ }

  return results;
}

function detectSport(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('nba') || n.includes('basketball')) return 'basketball_nba';
  if (n.includes('ncaa') && n.includes('basket')) return 'basketball_ncaab';
  if (n.includes('nhl') || n.includes('hockey')) return 'icehockey_nhl';
  if (n.includes('mls') || n.includes('soccer') || n.includes('football') && n.includes('mls')) return 'soccer_usa_mls';
  return null;
}

function normalizeMarket(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('money') || n.includes('match') || n === 'winner' || n.includes('1x2') || n.includes('moneyline')) return 'h2h';
  if (n.includes('spread') || n.includes('handicap') || n.includes('point')) return 'spreads';
  if (n.includes('total') || n.includes('over') || n.includes('under')) return 'totals';
  return null;
}

function parseOdds(price: unknown): number | null {
  if (typeof price === 'number') {
    // Decimal to American
    if (price >= 2.0) return Math.round((price - 1) * 100);
    if (price > 1.0) return Math.round(-100 / (price - 1));
  }
  if (typeof price === 'string') {
    const n = parseFloat(price);
    if (!isNaN(n)) return parseOdds(n);
  }
  return null;
}

async function runScrape() {
  await initDb();

  const startTime = Date.now();
  let casinoOddsInserted = 0;
  let sharpOddsInserted = 0;

  // --- Scrape casinos ---
  const casinos = [
    { id: 'treasure_bay', url: 'https://bettreasurebay.com' },
    { id: 'palace_casino', url: 'https://sportsbook.palacecasinoresort.com' },
  ];

  for (const casino of casinos) {
    const rows = await scrapeCasino(casino.id, casino.url);
    for (const row of rows) {
      await sql`
        INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
        VALUES (${row.eventId}, ${row.sport}, ${row.homeTeam}, ${row.awayTeam}, ${row.startTime}, ${casino.id}, NOW())
        ON CONFLICT (event_id) DO UPDATE SET last_seen = NOW(), start_time = EXCLUDED.start_time
      `;
      await sql`
        INSERT INTO odds_snapshots (event_id, casino_id, market, selection, odds, line)
        VALUES (${row.eventId}, ${casino.id}, ${row.market}, ${row.selection}, ${row.odds}, ${row.line})
      `;
      casinoOddsInserted++;
    }
  }

  // --- Fetch sharp lines ---
  if (ODDS_API_KEY) {
    for (const sport of SPORTS) {
      const events = await fetchSharpOdds(sport);
      for (const event of events) {
        for (const book of event.bookmakers) {
          for (const market of book.markets) {
            for (const outcome of market.outcomes) {
              // Convert decimal to american if needed
              const odds = outcome.price > 10
                ? outcome.price  // already american-ish
                : outcome.price >= 2
                  ? Math.round((outcome.price - 1) * 100)
                  : Math.round(-100 / (outcome.price - 1));

              await sql`
                INSERT INTO sharp_odds (event_id, sport, home_team, away_team, start_time, market, selection, odds, book)
                VALUES (${event.id}, ${sport}, ${event.home_team}, ${event.away_team}, ${event.commence_time},
                        ${market.key}, ${outcome.name}, ${odds}, ${book.key})
              `;
              sharpOddsInserted++;
            }
          }
        }
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  return {
    ok: true,
    casino_odds_inserted: casinoOddsInserted,
    sharp_odds_inserted: sharpOddsInserted,
    elapsed_seconds: elapsed,
  };
}

// Vercel cron calls GET; manual/admin trigger uses POST
export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization header with CRON_SECRET, or we use SCRAPE_SECRET
  const auth = req.headers.get('authorization');
  if (SCRAPE_SECRET && auth !== `Bearer ${SCRAPE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runScrape();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (SCRAPE_SECRET && auth !== `Bearer ${SCRAPE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runScrape();
  return NextResponse.json(result);
}
