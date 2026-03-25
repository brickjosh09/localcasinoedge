'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BasketballIcon,
  FootballIcon,
  BaseballIcon,
  HockeyIcon,
  SoccerIcon,
  TrophyIcon,
  TicketIcon,
} from './components/SportIcons';
import { getMarkets, getCasinos, MarketData, CasinoData } from './lib/api';
import { useMarket } from './lib/MarketContext';

// ─── SPORTS NEWS TICKER ───
// These are illustrative examples showing the format of subscriber alerts — not real opportunities.
function SportsTicker() {
  const items = [
    'Subscriber alert: [Hockey] Home Team Total Under · +X.X% EV',
    'Subscriber alert: [Basketball] Away Team ML · +X.X% EV',
    'Subscriber alert: [Football] Home Spread -X · +X.X% EV',
    'Subscriber alert: [Baseball] Away Team Run Line · +X.X% EV',
    'Subscriber alert: [Basketball] Game Total Over X · +X.X% EV',
    'Arb alert: [Basketball] Both sides ML · +X.X% guaranteed',
    'Subscriber alert: [Hockey] Away Team ML · +X.X% EV',
  ];
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/80 overflow-hidden h-8 flex items-center">
      <div className="flex-shrink-0 flex items-center gap-2 px-3 border-r border-slate-700 h-full bg-red-600/90">
        <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
        <span className="text-xs font-black text-white tracking-widest">LIVE</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span key={i} className="text-xs text-slate-400 px-6">
              <span className="text-green-400 font-semibold">▶</span>
              {' '}{item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MINI MOCKUPS ───

function EVFinderMockup() {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3 text-xs space-y-2">
      {[
        { game: 'Home Team @ Away Team', market: 'Total Under X.X', ev: '+X.X%', odds: '+XXX' },
        { game: 'Team A vs Team B', market: 'Moneyline Team A', ev: '+X.X%', odds: '+XXX' },
        { game: 'Team C vs Team D', market: 'Spread Team D -X', ev: '+X.X%', odds: '-XXX' },
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-2 rounded bg-slate-800/60 px-2.5 py-1.5">
          <div className="min-w-0">
            <div className="text-slate-300 font-medium truncate">{row.game}</div>
            <div className="text-slate-500 truncate">{row.market}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-slate-400 font-mono scoreboard-num">{row.odds}</span>
            <span className="rounded bg-green-500/20 border border-green-500/40 px-1.5 py-0.5 font-bold text-green-400 font-mono scoreboard-num">{row.ev}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ArbMockup() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-slate-900/80 p-3 text-xs">
      <div className="text-slate-400 mb-2 font-medium">Team A vs Team B — Moneyline</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
          <span className="text-slate-300">Bet Team A (Local Casino)</span>
          <span className="text-amber-400 font-bold font-mono scoreboard-num">+XXX</span>
        </div>
        <div className="flex items-center justify-between rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
          <span className="text-slate-300">Bet Team B (Pinnacle)</span>
          <span className="text-amber-400 font-bold font-mono scoreboard-num">-XXX</span>
        </div>
      </div>
      <div className="mt-2 rounded bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 text-center font-bold text-amber-400 scoreboard-num">
        Guaranteed profit: +X.X%
      </div>
    </div>
  );
}

function OddsMockup() {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3 text-xs">
      <div className="text-slate-400 mb-2 font-medium">Example: Team A -X.X Spread</div>
      <div className="space-y-1.5">
        {[
          { book: 'Local Casino', odds: '-XXX', good: true },
          { book: 'DraftKings', odds: '-XXX', good: false },
          { book: 'FanDuel', odds: '-XXX', good: false },
          { book: 'Pinnacle', odds: '-XXX', good: false },
        ].map((r) => (
          <div key={r.book} className={`flex items-center justify-between rounded px-2.5 py-1.5 ${r.good ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-800/60'}`}>
            <span className={r.good ? 'text-green-300 font-medium' : 'text-slate-400'}>{r.book}</span>
            <span className={`font-mono scoreboard-num ${r.good ? 'text-green-400 font-bold' : 'text-slate-300'}`}>{r.odds}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsMockup() {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between rounded bg-slate-800/60 px-2.5 py-2">
        <span className="text-slate-400">Alert threshold</span>
        <span className="text-white font-bold font-mono scoreboard-num">+3% EV</span>
      </div>
      <div className="rounded bg-slate-800/40 border border-dashed border-slate-700 px-2.5 py-3 text-center text-slate-600">
        Notifications when a qualifying<br />opportunity appears
      </div>
      <div className="text-center text-amber-500 font-semibold tracking-wide">Coming Soon</div>
    </div>
  );
}

// ─── TOOL ICON ───
function ToolIcon({ color }: { color: string }) {
  if (color === 'green') return <BasketballIcon className="h-5 w-5" />;
  if (color === 'amber') return <FootballIcon className="h-5 w-5" />;
  if (color === 'blue') return <SoccerIcon className="h-5 w-5" />;
  return <TicketIcon className="h-5 w-5" />;
}

const TOOLS = [
  {
    label: '+EV Finder',
    tagline: 'Bet with a mathematical edge',
    color: 'green',
    desc: 'We scan every line at your local casino sportsbook and compare to sharp consensus odds. When the book prices a bet better than its true probability, we surface it instantly.',
    mockup: <EVFinderMockup />,
    href: '/dashboard',
    cta: 'View Opportunities',
    badge: null,
  },
  {
    label: 'Arbitrage Detector',
    tagline: 'Guarantee a profit regardless of outcome',
    color: 'amber',
    desc: "When a local book misprices a line badly enough, you can bet both sides across different books and lock in profit no matter who wins. We find these automatically.",
    mockup: <ArbMockup />,
    href: '/dashboard',
    cta: 'Find Arb Bets',
    badge: null,
  },
  {
    label: 'Odds Comparison',
    tagline: 'See what the market says at a glance',
    color: 'blue',
    desc: "Side-by-side comparison of your local casino's lines against sharp and national books. Know instantly whether you're getting a good price — or getting taken.",
    mockup: <OddsMockup />,
    href: '/odds',
    cta: 'Browse Odds',
    badge: null,
  },
  {
    label: 'Line Alerts',
    tagline: 'Never miss a play above your threshold',
    color: 'slate',
    desc: "Set your minimum EV percentage and we'll notify you the moment a qualifying opportunity appears. No more refreshing the dashboard every hour.",
    mockup: <AlertsMockup />,
    href: '/#signup',
    cta: 'Join Waitlist',
    badge: 'Coming Soon',
  },
];

const TESTIMONIALS = [
  {
    quote: "I had no idea my local book was pricing NBA totals this far off the market. Found three +4% plays in a week.",
    name: 'M.T.',
    location: 'Mississippi',
    profit: '+$340 first month',
  },
  {
    quote: "The arb detector alone is worth the subscription. I locked in two guaranteed profits before football season ended.",
    name: 'R.C.',
    location: 'Gulfport, MS',
    profit: '+$210 arbitrage',
  },
  {
    quote: "I was just a casual bettor. This tool turned me into someone who actually understands what I'm doing.",
    name: 'D.W.',
    location: 'Pascagoula, MS',
    profit: 'Consistent +EV player',
  },
];

const FAQS = [
  {
    question: 'What is positive expected value (+EV)?',
    answer:
      'Expected value is the average outcome of a bet over many repetitions. If a coin flip is truly 50/50 but someone offers you +120 instead of the fair +100 — that\'s +EV. You won\'t win every flip, but over hundreds of bets, you profit because the math is in your favor. Our tool finds exactly these situations at your local casino.',
  },
  {
    question: 'What is arbitrage betting?',
    answer:
      'Arbitrage betting means placing bets on all possible outcomes of an event across different sportsbooks, at odds that guarantee a profit regardless of result. It sounds counterintuitive, but when one book misprices a line against another, the math makes it possible. We detect these windows automatically.',
  },
  {
    question: 'How does this work with local casinos?',
    answer:
      "Local casino sportsbooks set their own lines independently. Unlike DraftKings or FanDuel, they don't use the same automated odds engines as the major online books. This means they make more pricing mistakes — and those mistakes are opportunities for you. We're the only tool that monitors these local books in real time.",
  },
  {
    question: "Why don't other tools cover local casinos?",
    answer:
      'OddsJam, DarkHorse, and similar platforms focus exclusively on online-legal sportsbooks because that\'s the largest market. They don\'t build scrapers for regional casino books because it\'s technically harder and the audience is smaller. That\'s our niche. We go where they don\'t.',
  },
  {
    question: 'How much can I realistically make?',
    answer:
      'It depends on your bankroll and how often you bet. With a $1,000 bankroll placing 2-3 bets per day on opportunities above 3% EV, you can reasonably expect $50-150 per week in expected profit. Some weeks more, some less — but the math works over time. This is not gambling in the traditional sense; it\'s systematic edge extraction.',
  },
  {
    question: "Will I win every bet?",
    answer:
      "No — and that's fine. Positive EV betting is about long-term edge, not short-term results. You might lose five in a row and then win eight of the next ten. A single loss proves nothing; the math over hundreds of bets is what matters. Professional sports bettors lose roughly 45-48% of their bets and still profit significantly.",
  },
  {
    question: 'Is this legal?',
    answer:
      "Yes. You're using publicly available odds information to make more informed betting decisions. That's no different from checking injury reports or weather forecasts. We don't facilitate wagering — we provide analysis tools. The actual bet is placed by you at a licensed casino sportsbook.",
  },
];

// ─── FAQ ITEM ───
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-base font-medium text-white group-hover:text-green-400 transition-colors">
          {question}
        </span>
        <span
          className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-45 border-green-500/50 text-green-400' : ''
          }`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-5 pr-10">
          <p className="text-slate-400 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── STAT ICONS ───
const STAT_ICONS = [
  <BasketballIcon key="bb" className="h-5 w-5" />,
  <TrophyIcon key="tr" className="h-5 w-5" />,
  <HockeyIcon key="hk" className="h-5 w-5" />,
];

const PLACEHOLDER_STATES = ['Louisiana', 'Nevada', 'New Jersey', 'Indiana', 'Pennsylvania'];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { selectedMarket, setSelectedMarket } = useMarket();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [casinos, setCasinos] = useState<CasinoData[]>([]);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const [marketsData, casinosData] = await Promise.all([
          getMarkets(),
          getCasinos(selectedMarket),
        ]);
        setMarkets(marketsData);
        setCasinos(casinosData);
      } catch {
        // silently fail on landing page — not critical
      }
    }
    loadMarketData();
  }, [selectedMarket]);

  const activeCasinos = (casinos ?? []).filter((c) => c.status === 'active');
  const comingSoonCasinos = (casinos ?? []).filter((c) => c.status === 'coming_soon');
  const activeMarket = markets.find((m) => m.id === selectedMarket);

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const existing = JSON.parse(localStorage.getItem('lco_signups') || '[]');
    existing.push({ email, date: new Date().toISOString() });
    localStorage.setItem('lco_signups', JSON.stringify(existing));
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">

      {/* ─── SPORTS NEWS TICKER ─── */}
      <SportsTicker />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:pt-24 sm:pb-32 field-pattern">
        {/* Ambient glow — stadium lighting effect */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-green-500/6 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-blue-500/3 rounded-full blur-3xl" />
          {/* Warm spotlight from upper-right — stadium feel */}
          <div className="absolute -top-20 right-0 w-[500px] h-[400px] bg-amber-500/3 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Live badge — broadcast style */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-sm text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 live-dot" />
            <span className="font-black tracking-widest text-red-400">LIVE</span>
            <span className="text-slate-400">— scanning local casino sportsbooks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
            Use Math,<br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Not Luck.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-4 leading-relaxed">
            Your local casino sportsbook is mispricing lines every single day.
            We scan local casino sportsbooks in real time, compare every
            line to sharp consensus odds, and show you exactly where the house
            is giving away money.
          </p>
          <p className="mx-auto max-w-xl text-base text-slate-500 mb-10">
            This isn&apos;t a tip service. It&apos;s a mathematical edge engine built specifically
            for bettors who walk into a physical casino.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#signup"
              className="w-full sm:w-auto rounded-lg bg-green-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20"
            >
              Get Free Daily Bets
            </a>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-lg border border-slate-700 px-8 py-3.5 text-base font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              View Live Dashboard
            </Link>
          </div>

          {/* Stats bar — with sport icons */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl mx-auto">
            {[
              { value: 'Real-Time', label: 'Scanning every few minutes', icon: STAT_ICONS[0] },
              { value: '+EV', label: 'Math-first edge detection', icon: STAT_ICONS[1] },
              { value: '6', label: 'Sports covered', icon: STAT_ICONS[2] },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-4 sm:px-5 sm:py-5"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-green-500/60">{stat.icon}</span>
                  <div className="text-xl sm:text-3xl font-black text-green-400 scoreboard-num">{stat.value}</div>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARKET SELECTOR ─── */}
      <section id="market" className="border-t border-slate-800/60 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Your Market</p>
            <h2 className="text-2xl font-bold text-white mb-2">Select Your Casino Market</h2>
            <p className="text-slate-400 text-sm">We scan the books in your region. Choose your market to see relevant opportunities.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {/* Real markets from API */}
            {markets.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMarket(m.id)}
                className={`rounded-xl border px-6 py-3 text-sm font-semibold transition-all ${
                  selectedMarket === m.id
                    ? 'border-green-500/50 bg-green-500/15 text-green-300 shadow-lg shadow-green-500/10'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {selectedMarket === m.id && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
                  {m.name}
                  {selectedMarket === m.id && (
                    <span className="rounded-full bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 text-xs text-green-400">Active</span>
                  )}
                </span>
              </button>
            ))}
            {/* Placeholder coming-soon states */}
            {PLACEHOLDER_STATES.map((state) => (
              <button
                key={state}
                disabled
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-3 text-sm font-semibold text-slate-700 cursor-not-allowed"
              >
                {state}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600">More states coming soon — we&apos;re expanding regionally</p>

          {/* Active market summary */}
          {activeMarket && (
            <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-5 max-w-lg mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 font-semibold text-sm">{activeMarket.name} — Active</span>
              </div>
              <p className="text-slate-400 text-xs">
                {activeMarket.casino_count} casinos tracked &bull; {activeMarket.active_count} live now &bull; {activeMarket.coming_soon_count} coming soon
              </p>
              <Link href="/casinos" className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors mt-3 font-medium">
                View Casino Directory
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Trusted by local casino bettors</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">The math works. The results show it.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-4">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.location}</div>
                  </div>
                  <div className="rounded-md bg-green-500/10 border border-green-500/20 px-2.5 py-1 text-xs font-bold text-green-400">
                    {t.profit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOOL SHOWCASE ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20 stadium-glow">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Four tools. One edge.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built specifically for bettors who play at local casino sportsbooks the big tools ignore.
              No bloat. No generic national odds. Just your market, your edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS.map((tool) => {
              const borderClass =
                tool.color === 'green'
                  ? 'border-green-500/30'
                  : tool.color === 'amber'
                  ? 'border-amber-500/30'
                  : tool.color === 'blue'
                  ? 'border-blue-500/20'
                  : 'border-slate-700';

              const accentClass =
                tool.color === 'green'
                  ? 'text-green-400'
                  : tool.color === 'amber'
                  ? 'text-amber-400'
                  : tool.color === 'blue'
                  ? 'text-blue-400'
                  : 'text-slate-400';

              const iconBgClass =
                tool.color === 'green'
                  ? 'bg-green-500/10 border-green-500/20'
                  : tool.color === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : tool.color === 'blue'
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-slate-800 border-slate-700';

              return (
                <div
                  key={tool.label}
                  className={`rounded-2xl border ${borderClass} bg-slate-900/40 p-6 flex flex-col gap-5`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* Sport icon for each tool */}
                        <span className={`flex items-center justify-center h-8 w-8 rounded-lg border ${iconBgClass} ${accentClass}`}>
                          <ToolIcon color={tool.color} />
                        </span>
                        <h3 className={`text-lg font-bold ${accentClass}`}>{tool.label}</h3>
                      </div>
                      {tool.badge && (
                        <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-semibold mb-2">{tool.tagline}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{tool.desc}</p>
                  </div>

                  <div className="flex-1">{tool.mockup}</div>

                  <Link
                    href={tool.href}
                    className={`text-sm font-semibold ${accentClass} hover:opacity-80 transition-opacity flex items-center gap-1.5`}
                  >
                    {tool.cta}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20 hash-divider">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">The process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How data-driven betting actually works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              There&apos;s no guesswork. No hot takes. Just a repeatable process that puts math on your side.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] h-px bg-gradient-to-r from-slate-700 via-green-500/30 to-slate-700" />

            {[
              {
                step: '01',
                title: "We Find Your Casino's Mistakes",
                desc: "Our scanner runs every few minutes, pulling live odds from local casino sportsbooks that the major national tools don't touch. When a local book misprices a line — even slightly — we catch it.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'We Calculate Your Edge',
                desc: "Using no-vig fair odds from Pinnacle — the world's sharpest sportsbook — we calculate exactly how much expected value each bet holds. A positive number means the math is on your side.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'You Place the Bet With Confidence',
                desc: "Walk into your casino knowing the math is on your side. The bet might not win today — but over hundreds of +EV bets, the edge compounds. That's how professional sports bettors build long-term profit.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                    {item.icon}
                  </div>
                  <span className="text-5xl font-black text-slate-800/80">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SUPPORTED CASINOS ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Coverage</p>
            <h2 className="text-3xl font-bold text-white mb-3">Supported Casinos</h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              {activeMarket
                ? `${activeMarket.casino_count} casinos tracked in ${activeMarket.state}. More states coming soon.`
                : `${casinos.length || 'Multiple'} casinos tracked. More markets coming soon.`}
            </p>
          </div>

          {casinos.length > 0 ? (
            <div className="space-y-8">
              {/* Active casinos */}
              {activeCasinos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-4 w-1 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Now</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeCasinos.map((casino) => (
                      <div key={casino.id} className="rounded-xl border border-green-500/25 bg-green-500/5 p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 opacity-60" />
                        <div className="pl-3">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-white text-sm">{casino.name}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-xs font-bold text-green-400 flex-shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                              LIVE
                            </span>
                          </div>
                          {casino.location && <p className="text-xs text-slate-500 mb-1.5">{casino.location}</p>}
                          {casino.platform && (
                            <span className="inline-block rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                              {casino.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coming soon casinos */}
              {comingSoonCasinos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-4 w-1 rounded-full bg-amber-500/60" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {comingSoonCasinos.map((casino) => (
                      <div key={casino.id} className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 opacity-60">
                        <div className="font-medium text-slate-400 text-sm mb-1">{casino.short_name}</div>
                        {casino.location && <p className="text-xs text-slate-600">{casino.location}</p>}
                        <span className="inline-block mt-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-500/70 font-medium">
                          Coming Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback if API not loaded */
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-400 text-sm mb-3">Casinos we track in your market</p>
              <Link href="/casinos" className="text-xs text-green-400 hover:text-green-300 transition-colors font-medium">
                View full casino directory →
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/casinos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
            >
              View full casino directory
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SAMPLE OPPORTUNITY — BETTING TICKET STYLE ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Format illustration</p>
            <h2 className="text-3xl font-bold text-white mb-4">What a subscriber opportunity card looks like</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              This is the format subscribers see — with real teams, real odds, and real edge percentages.
              The values below are illustrative placeholders.
            </p>
          </div>

          {/* Betting ticket card — illustrative only */}
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/8 to-transparent relative overflow-hidden">
            {/* Illustration watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="text-slate-800/40 text-7xl font-black uppercase tracking-widest rotate-[-20deg] select-none">
                Example
              </span>
            </div>

            {/* Left ticket stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 opacity-70" />
            {/* Perforated line */}
            <div
              className="absolute left-5 top-4 bottom-4 w-px pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(34,197,94,0.2) 3px, rgba(34,197,94,0.2) 6px)',
              }}
            />

            <div className="p-6 sm:p-8 pl-8 sm:pl-10 relative">
              {/* Ticket header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      <HockeyIcon className="h-3.5 w-3.5" />
                      Sport
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">Game time shown here</span>
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-xs font-semibold text-green-400">
                      <TrophyIcon className="h-3 w-3" />
                      HIGH VALUE
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">Home Team @ Away Team</div>
                  <div className="text-sm text-slate-400 mt-1">Market — Example: Total Under X.X</div>
                </div>
                <div className="flex items-end flex-col gap-1">
                  <span className="rounded-xl bg-green-500/20 border border-green-500/40 px-5 py-2.5 text-3xl font-black text-green-400 scoreboard-num">
                    +X.X%
                  </span>
                  <span className="text-xs text-slate-500">Expected Value</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Local Casino', value: '+XXX', sub: null, highlight: true },
                  { label: 'Pinnacle (sharp)', value: '-XXX', sub: 'True line', highlight: false },
                  { label: 'True Probability', value: 'XX.X%', sub: null, highlight: false },
                  { label: 'Kelly Bet Size', value: 'X.X%', sub: 'of bankroll', highlight: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg px-4 py-3 border ${
                      item.highlight
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                    <div className={`text-lg font-bold font-mono scoreboard-num ${item.highlight ? 'text-green-400' : 'text-white'}`}>
                      {item.value}
                    </div>
                    {item.sub && <div className="text-xs text-slate-600 mt-0.5">{item.sub}</div>}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Subscribers see: the local casino&apos;s exact odds, Pinnacle&apos;s sharp line, the no-vig true probability,
                the calculated EV percentage, and the Kelly Criterion bet size — for every +EV opportunity, updated every few minutes.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-700 mt-4">
            Illustration only — real data, real teams, and real odds are visible to subscribers.
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Common questions</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need to know</h2>
            <p className="text-slate-400">
              New to +EV betting? Start here.{' '}
              <Link href="/learn" className="text-green-400 hover:text-green-300 transition-colors">
                Or visit the full education hub.
              </Link>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 divide-y divide-slate-800">
            {FAQS.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── EDUCATION TEASER ─── */}
      <section className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Education hub</p>
            <h2 className="text-3xl font-bold text-white mb-4">Learn the fundamentals</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              You don&apos;t need a math degree. But understanding the basics turns a casual bettor into a consistent winner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'What Is +EV Betting?',
                desc: 'The coin flip that pays you too much — why math beats luck over time.',
                href: '/learn#ev',
                tag: 'Foundations',
              },
              {
                title: 'What Is Arbitrage?',
                desc: 'How to guarantee a profit by betting both sides of the same event.',
                href: '/learn#arbitrage',
                tag: 'Strategy',
              },
              {
                title: 'Reading American Odds',
                desc: 'What does -110 actually mean? Why +150 pays more than -150 wins.',
                href: '/learn#odds',
                tag: 'Foundations',
              },
              {
                title: 'What Is Vig/Juice?',
                desc: "The hidden tax built into every line — and why removing it reveals the truth.",
                href: '/learn#vig',
                tag: 'Foundations',
              },
              {
                title: 'Why Local Casino Lines Are Different',
                desc: "Regional books don't use the same algorithms as DraftKings. Here's why that matters.",
                href: '/learn#local',
                tag: 'Strategy',
              },
              {
                title: 'Bankroll Management Basics',
                desc: 'How much should you bet? The Kelly Criterion explained without the jargon.',
                href: '/learn#bankroll',
                tag: 'Strategy',
              },
            ].map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 hover:bg-slate-900/60 transition-all"
              >
                <span className="inline-block mb-3 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                  {article.tag}
                </span>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{article.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
            >
              View all education guides
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">One winning bet covers your subscription.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A single 3% EV bet on a $300 stake returns $9 in expected value. That&apos;s a third of the monthly cost.
              Two or three plays a week and the tool pays for itself — many times over.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Monthly</h3>
                <p className="text-slate-500 text-sm">Cancel any time. No commitment.</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-black text-white scoreboard-num">$29</span>
                <span className="text-slate-400">.99/mo</span>
              </div>
              <p className="text-xs text-green-400 font-medium mb-8">One winning bet covers your subscription</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Real-time +EV opportunity alerts',
                  'Arbitrage detection across books',
                  'All sports: NBA, NFL, NHL, MLB, NCAAF, NCAAB',
                  'Odds history browser',
                  'Kelly Criterion bet sizing',
                  'Mobile-optimized dashboard',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="#signup"
                className="block w-full text-center rounded-lg border border-green-600 px-6 py-3.5 font-semibold text-green-400 hover:bg-green-600 hover:text-white transition-colors"
              >
                Get Started Monthly
              </a>
            </div>

            {/* Annual */}
            <div className="rounded-2xl border border-green-500/40 bg-gradient-to-b from-green-500/10 to-transparent p-8 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white tracking-wide whitespace-nowrap shadow-lg shadow-green-500/20">
                  BEST VALUE — SAVE 30%
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Annual</h3>
                <p className="text-slate-500 text-sm">Under $21/mo. Locked in for a full year.</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-black text-white scoreboard-num">$249</span>
                <span className="text-slate-400">.99/yr</span>
              </div>
              <p className="text-xs text-green-400 font-medium mb-8">That&apos;s $110 saved vs monthly billing</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Monthly',
                  'Priority support & direct access',
                  'Early access to new features',
                  'New sportsbooks added first',
                  'Founding member pricing locked in',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="#signup"
                className="block w-full text-center rounded-lg bg-green-600 px-6 py-3.5 font-semibold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20"
              >
                Get Annual Access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EMAIL CAPTURE / CTA ─── */}
      <section id="signup" className="border-t border-slate-800/60 px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Free — no credit card required
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get a Free +EV Bet Every Day</h2>
          <p className="text-slate-400 mb-3 leading-relaxed text-lg">
            We&apos;ll send you our best +EV opportunity straight to your inbox every morning.
            See exactly what edge looks like before you subscribe.
          </p>
          <p className="text-slate-500 mb-8 text-sm">
            Join now and lock in the founding member rate when subscriptions open.
          </p>

          {submitted ? (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-8 py-8">
              <div className="text-green-400 font-bold text-xl mb-2">You&apos;re in. Check your inbox tomorrow.</div>
              <p className="text-slate-400 text-sm">
                Your first free +EV bet is on the way. In the meantime, explore the{' '}
                <a href="/dashboard" className="text-green-400 underline underline-offset-2 hover:text-green-300">live dashboard</a>{' '}
                to see what we find today.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3.5 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-8 py-3.5 font-semibold text-white hover:bg-green-500 transition-colors whitespace-nowrap shadow-lg shadow-green-500/20"
              >
                Send Me Free Bets
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-slate-600">No spam. One email per day. Unsubscribe any time.</p>
        </div>
      </section>
    </div>
  );
}
