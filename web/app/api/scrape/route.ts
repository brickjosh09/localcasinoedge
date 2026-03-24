import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

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

type IgtNode = Record<string, unknown>;

// Parse IGT nav tree — mirrors Python parse_nav_tree()
// Nav JSON: { bonavigationnodes: [ { name, idfwbonavigation, marketgroups: [{idfwmarketgroup}], bonavigationnodes: [...] } ] }
function extractMarketGroupIds(data: unknown): string[] {
  const results: string[] = [];

  function walk(node: IgtNode) {
    // Collect market groups at this level
    const mgs = node.marketgroups as IgtNode[] | undefined;
    if (Array.isArray(mgs)) {
      for (const mg of mgs) {
        const mgId = mg.idfwmarketgroup;
        if (mgId != null) results.push(String(mgId));
      }
    }
    // Recurse into child nav nodes
    const children = node.bonavigationnodes as IgtNode[] | undefined;
    if (Array.isArray(children)) {
      for (const child of children) walk(child);
    }
  }

  let topNodes: IgtNode[] = [];
  if (Array.isArray(data)) {
    topNodes = data as IgtNode[];
  } else if (data && typeof data === 'object') {
    const d = data as IgtNode;
    topNodes = (d.bonavigationnodes as IgtNode[]) ?? [];
  }

  for (const node of topNodes) walk(node);
  return results;
}

// Parse IGT market group — mirrors Python parse_market_group()
// MG JSON: { events: [ { idfoevent, participantname_home, participantname_away,
//   externaldescription, tsstart, islive,
//   markets: [ { name, selections: [ { name, currentpriceup, currentpricedown, currenthandicap } ] } ] } ] }
function parseMarketGroup(
  mg: IgtNode,
  casinoId: string,
  sportName: string,
  mgId: string,
): Array<{
  eventId: string; sport: string; homeTeam: string; awayTeam: string;
  startTime: string; market: string; selection: string; odds: number; line: number | null;
}> {
  const results: Array<{
    eventId: string; sport: string; homeTeam: string; awayTeam: string;
    startTime: string; market: string; selection: string; odds: number; line: number | null;
  }> = [];

  const eventList = (mg.events as IgtNode[]) ?? [];
  for (const ev of eventList) {
    const rawId = ev.idfoevent;
    if (!rawId) continue;
    const eventId = `${casinoId}:${rawId}`;
    const home = String(ev.participantname_home ?? '');
    const away = String(ev.participantname_away ?? '');
    const startTime = String(ev.tsstart ?? '');
    const sport = detectSport(sportName);
    if (!sport) continue;

    const markets = (ev.markets as IgtNode[]) ?? [];
    for (const mkt of markets) {
      const marketName = String(mkt.name ?? '');
      const marketKey = normalizeMarket(marketName);
      if (!marketKey) continue;

      const selections = (mkt.selections as IgtNode[]) ?? [];
      for (const sel of selections) {
        const pu = Number(sel.currentpriceup ?? 0);
        const pd = Number(sel.currentpricedown ?? 0);
        if (pd === 0) continue;
        const decimal = (pu / pd) + 1;
        const american = decimal >= 2
          ? Math.round((decimal - 1) * 100)
          : Math.round(-100 / (decimal - 1));
        if (american === 0) continue;

        const selName = String(sel.name ?? '');
        const rawHandicap = sel.currenthandicap;
        const line = rawHandicap != null ? Number(rawHandicap) : null;

        results.push({ eventId, sport, homeTeam: home, awayTeam: away, startTime, market: marketKey, selection: selName, odds: american, line });
      }
    }
  }
  return results;
}

// Scrape one casino using correct IGT field names
async function scrapeCasino(casinoId: string, baseUrl: string): Promise<Array<{
  eventId: string; sport: string; homeTeam: string; awayTeam: string;
  startTime: string; market: string; selection: string; odds: number; line: number | null;
}>> {
  const results: Array<{
    eventId: string; sport: string; homeTeam: string; awayTeam: string;
    startTime: string; market: string; selection: string; odds: number; line: number | null;
  }> = [];

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; LocalCasinoEdge/1.0)' };
    const navRes = await fetch(`${baseUrl}/cache/psbonav/1/UK/top.json`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!navRes.ok) return results;
    const nav = await navRes.json() as IgtNode;

    // Get sport names for each nav node (for sport detection)
    const navTopNodes = (nav.bonavigationnodes as IgtNode[]) ?? [];

    // Walk nav to collect {mgId, sportName} pairs
    const mgList: Array<{ mgId: string; sportName: string }> = [];
    function walkNav(node: IgtNode, parentSport = '') {
      const name = String(node.name ?? parentSport);
      const mgs = (node.marketgroups as IgtNode[]) ?? [];
      for (const mg of mgs) {
        const mgId = mg.idfwmarketgroup;
        if (mgId != null) mgList.push({ mgId: String(mgId), sportName: name });
      }
      const children = (node.bonavigationnodes as IgtNode[]) ?? [];
      for (const child of children) walkNav(child, name);
    }
    for (const node of navTopNodes) walkNav(node);

    // Limit to first 40 groups to stay within serverless timeout
    const toScrape = mgList.slice(0, 40);

    for (const { mgId, sportName } of toScrape) {
      try {
        const mgRes = await fetch(`${baseUrl}/cache/psmg/1/UK/${mgId}.json`, {
          headers,
          signal: AbortSignal.timeout(5000),
        });
        if (!mgRes.ok) continue;
        const mg = await mgRes.json() as IgtNode;
        const parsed = parseMarketGroup(mg, casinoId, sportName, mgId);
        results.push(...parsed);
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
      await query(
        `INSERT INTO events (event_id, sport, home_team, away_team, start_time, casino_id, last_seen)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (event_id) DO UPDATE SET last_seen = NOW(), start_time = EXCLUDED.start_time`,
        [row.eventId, row.sport, row.homeTeam, row.awayTeam, row.startTime, casino.id]
      );
      await query(
        `INSERT INTO odds_snapshots (event_id, casino_id, market, selection, odds, line)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.eventId, casino.id, row.market, row.selection, row.odds, row.line]
      );
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
              const odds = outcome.price > 10
                ? outcome.price
                : outcome.price >= 2
                  ? Math.round((outcome.price - 1) * 100)
                  : Math.round(-100 / (outcome.price - 1));

              await query(
                `INSERT INTO sharp_odds (event_id, sport, home_team, away_team, start_time, market, selection, odds, book)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [event.id, sport, event.home_team, event.away_team, event.commence_time,
                 market.key, outcome.name, odds, book.key]
              );
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
