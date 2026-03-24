'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getStatus, getOpportunities, getSports, getMarkets, getCasinos, StatusData, Opportunity, SportData, MarketData, CasinoData } from '../lib/api';
import { formatRelativeTime } from '../lib/format';
import OpportunityCard from '../components/OpportunityCard';
import SportTabs from '../components/SportTabs';
import { useMarket } from '../lib/MarketContext';
import { isBetaUser, activateBeta } from '../lib/auth';

type SortKey = 'ev_percent' | 'start_time';

// ─── PAYWALL GATE ───
function PaywallGate() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-green-500/4 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg text-center">

          {/* Lock icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 shadow-2xl shadow-slate-950/60">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-transparent" />
              <svg className="relative h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>

          {/* Page context */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Dashboard</p>

          {/* Headline */}
          <h1 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Real-Time +EV Opportunities
          </h1>

          {/* Description */}
          <p className="mb-8 text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
            Live scanning of local casino odds vs sharp lines. Every +EV bet, arbitrage opportunity,
            and line discrepancy — updated every few minutes.
          </p>

          {/* What's included */}
          <div className="mb-10 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">What subscribers see</p>
            <ul className="space-y-3">
              {[
                'All +EV opportunities with exact odds and EV%',
                'Arbitrage detector — guaranteed profit plays',
                'Kelly Criterion bet sizing',
                'Sport and market filters',
                'Historical odds data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <svg className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Primary CTA */}
          <Link
            href="/#pricing"
            className="block w-full rounded-lg bg-green-600 px-6 py-4 text-base font-bold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20 mb-3"
          >
            Subscribe — $29.99/mo
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/#signup"
            className="block w-full rounded-lg border border-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Or get a free +EV bet daily
          </Link>

          <p className="mt-5 text-xs text-slate-600">Cancel any time. No commitment required.</p>
        </div>
      </div>
    </div>
  );
}

function HelpPanel({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">How to read this dashboard</h3>
          <p className="text-xs text-slate-400">A quick orientation for first-time users.</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Dismiss help"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            term: 'EV %',
            color: 'text-green-400',
            desc: 'Expected Value — how much you gain per $100 bet, on average, over many bets. +3% means you earn $3 for every $100 wagered long term.',
          },
          {
            term: 'True Probability',
            color: 'text-blue-400',
            desc: "The actual likelihood of an outcome, calculated from sharp books with the house margin removed. This is what the bet is really worth.",
          },
          {
            term: 'Local Casino vs Sharp',
            color: 'text-slate-300',
            desc: "We compare local casino odds to Pinnacle — the world's sharpest sportsbook. When your local book offers better odds than Pinnacle, it's +EV.",
          },
          {
            term: 'Kelly %',
            color: 'text-amber-400',
            desc: 'The Kelly Criterion — a mathematically optimal bet size as a percentage of your total bankroll. Bet this fraction to maximize long-term growth.',
          },
        ].map((item) => (
          <div key={item.term} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className={`text-xs font-bold mb-1 ${item.color}`}>{item.term}</div>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-800">
        <Link href="/learn" className="text-xs text-green-400 hover:text-green-300 transition-colors font-medium">
          Read the full education guide — understand +EV, arbitrage, and bankroll management in depth.
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [betaInput, setBetaInput] = useState('');
  const [betaError, setBetaError] = useState(false);

  useEffect(() => {
    setHasAccess(isBetaUser());
  }, []);

  const handleBetaCode = () => {
    if (activateBeta(betaInput)) {
      setHasAccess(true);
      setBetaError(false);
    } else {
      setBetaError(true);
    }
  };

  if (!hasAccess) {
    return (
      <>
        <PaywallGate />
        <div className="mx-auto max-w-md px-4 pb-20 -mt-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-400 mb-3">Have a beta access code?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={betaInput}
                onChange={(e) => { setBetaInput(e.target.value); setBetaError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleBetaCode()}
                placeholder="Enter code"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
              />
              <button
                onClick={handleBetaCode}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
              >
                Unlock
              </button>
            </div>
            {betaError && <p className="text-red-400 text-xs mt-2">Invalid code. Try again.</p>}
          </div>
        </div>
      </>
    );
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const { selectedMarket } = useMarket();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [sports, setSports] = useState<SportData[]>([]);
  const [marketInfo, setMarketInfo] = useState<MarketData | null>(null);
  const [activeCasinos, setActiveCasinos] = useState<CasinoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);

  const [activeSport, setActiveSport] = useState('all');
  const [minEV, setMinEV] = useState(0);
  const [marketFilter, setMarketFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('ev_percent');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, oppsData, sportsData, marketsData, casinosData] = await Promise.all([
        getStatus(),
        getOpportunities({ min_ev: minEV, sport: activeSport === 'all' ? undefined : activeSport }),
        getSports(),
        getMarkets(),
        getCasinos(selectedMarket),
      ]);
      setStatus(statusData);
      setOpportunities(oppsData);
      setSports(sportsData);
      setMarketInfo(marketsData.find((m) => m.id === selectedMarket) ?? null);
      setActiveCasinos(casinosData.filter((c) => c.status === 'active'));
    } catch {
      setError('Could not connect to the API. Make sure the backend is running on port 8787.');
    } finally {
      setLoading(false);
    }
  }, [minEV, activeSport, selectedMarket]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter + sort
  const filtered = opportunities
    .filter((o) => marketFilter === 'all' || o.market.toLowerCase() === marketFilter)
    .sort((a, b) => {
      if (sortBy === 'ev_percent') return b.ev_percent - a.ev_percent;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

  const evOpps = filtered.filter((o) => !o.is_arb);
  const arbOpps = filtered.filter((o) => o.is_arb);

  const sportTabs = [
    { label: 'All Sports', value: 'all', count: opportunities.length },
    ...sports.map((s) => ({
      label: s.sport,
      value: s.sport,
      count: opportunities.filter((o) => o.sport === s.sport).length,
    })),
  ];

  // Compute "Your Edge" summary stats
  const bestEdge = evOpps.length > 0 ? Math.max(...evOpps.map((o) => o.ev_percent)) : null;
  const uniqueSports = [...new Set(opportunities.map((o) => o.sport))];

  // Index of card with the highest EV (for the "best edge" trophy badge)
  const bestEVIndex = evOpps.length > 0
    ? evOpps.indexOf(evOpps.reduce((best, o) => (o.ev_percent > best.ev_percent ? o : best), evOpps[0]))
    : -1;

  // Casino display name for opportunity cards
  const casinoDisplayName = activeCasinos.length > 0 ? activeCasinos[0].short_name : 'Local Casino';

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* ─── TOP STATUS BAR — sports broadcast style ─── */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {status ? (
              <>
                {/* LIVE indicator — broadcast style */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-black text-white tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
                    LIVE
                  </span>
                  <span className="text-slate-400">
                    Last scan:{' '}
                    <span className="text-slate-200 font-medium">{formatRelativeTime(status.last_scrape_time)}</span>
                  </span>
                </div>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400">
                  Opportunities: <span className="text-green-400 font-bold scoreboard-num">{opportunities.length}</span>
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400">
                  Events: <span className="text-slate-200 font-medium scoreboard-num">{status.events_count}</span>
                </span>
                {activeCasinos.length > 0 && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">
                      Casino: <span className="text-slate-200 font-medium">{activeCasinos.map((c) => c.short_name).join(', ')}</span>
                    </span>
                  </>
                )}
              </>
            ) : loading ? (
              <span className="text-slate-500">Loading status...</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">Odds delayed up to 5 min</span>
            <button
              onClick={loadData}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {marketInfo ? `${marketInfo.name} — Live Opportunities` : 'Live Dashboard'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {activeCasinos.length > 0
                ? `${activeCasinos.map((c) => c.name).join(', ')} vs sharp consensus lines`
                : 'Local sportsbook vs sharp consensus lines'}
            </p>
            {activeCasinos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeCasinos.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    {c.short_name}
                  </span>
                ))}
                <Link href="/casinos" className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-center ml-1">
                  View all casinos →
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-md border border-slate-700 px-3 py-1.5 self-start"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showHelp ? 'Hide guide' : 'How to read this'}
          </button>
        </div>

        {/* Help panel */}
        {showHelp && <HelpPanel onDismiss={() => setShowHelp(false)} />}

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 mb-6">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ─── SCOREBOARD SUMMARY BAR ─── */}
        {!loading && !error && opportunities.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 mb-6 overflow-hidden">
            {/* Scoreboard header */}
            <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-700 flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-green-400" fill="currentColor" viewBox="0 0 16 16">
                <rect x="1" y="3" width="14" height="10" rx="1.5" />
                <rect x="3" y="5" width="3" height="6" rx="0.5" fill="#0f172a" />
                <rect x="8" y="5" width="3" height="6" rx="0.5" fill="#0f172a" />
                <rect x="6.5" y="6" width="1" height="1" rx="0.25" fill="#0f172a" />
                <rect x="6.5" y="8.5" width="1" height="1" rx="0.25" fill="#0f172a" />
              </svg>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Board</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-0 text-sm divide-x divide-slate-700/50">
              <div className="px-4 py-3">
                <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">+EV Plays</div>
                <div className="font-black text-xl text-green-400 scoreboard-num">{evOpps.length}</div>
              </div>
              {arbOpps.length > 0 && (
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">Arb Plays</div>
                  <div className="font-black text-xl text-amber-400 scoreboard-num">{arbOpps.length}</div>
                </div>
              )}
              {bestEdge !== null && (
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">Best Edge</div>
                  <div className="font-black text-xl text-green-400 scoreboard-num">+{bestEdge.toFixed(1)}%</div>
                </div>
              )}
              {uniqueSports.length > 0 && (
                <div className="px-4 py-3">
                  <div className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">Sports</div>
                  <div className="font-medium text-sm text-slate-300">{uniqueSports.join(' · ')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sport tabs */}
        <div className="mb-5">
          <SportTabs tabs={sportTabs} active={activeSport} onChange={setActiveSport} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Min EV:</label>
            <select
              value={minEV}
              onChange={(e) => setMinEV(Number(e.target.value))}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
            >
              <option value={0}>Any EV</option>
              <option value={1}>+1%</option>
              <option value={2}>+2%</option>
              <option value={3}>+3%</option>
              <option value={5}>+5%</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Market:</label>
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Markets</option>
              <option value="moneyline">Moneyline</option>
              <option value="spread">Spread</option>
              <option value="total">Total</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
            >
              <option value="ev_percent">EV % (highest first)</option>
              <option value="start_time">Start time (soonest first)</option>
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-3" />
                <div className="h-6 bg-slate-800 rounded w-2/3 mb-4" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-slate-800 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* +EV Opportunities */}
        {!loading && (
          <>
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                  <span className="h-5 w-1 rounded-full bg-green-500" />
                  +EV Opportunities
                  <span className="text-sm font-normal text-slate-500">({evOpps.length})</span>
                </h2>
              </div>

              {evOpps.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
                  {/* Sports-themed empty state */}
                  <div className="mb-4 flex justify-center">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full border border-slate-700 bg-slate-800/60">
                      <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-slate-400 font-semibold mb-1">No opportunities on the board right now.</p>
                  <p className="text-slate-600 text-sm">We&apos;re scanning... try lowering the minimum EV or selecting a different sport.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evOpps.map((opp, i) => (
                    <OpportunityCard
                      key={`${opp.event}-${opp.market}-${opp.selection}-${i}`}
                      opp={opp}
                      isBest={i === bestEVIndex}
                      casinoName={casinoDisplayName}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Arbitrage section */}
            {arbOpps.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                    <span className="h-5 w-1 rounded-full bg-amber-500" />
                    Arbitrage Opportunities
                    <span className="text-sm font-normal text-slate-500">({arbOpps.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {arbOpps.map((opp, i) => (
                    <OpportunityCard key={`arb-${opp.event}-${opp.market}-${i}`} opp={opp} casinoName={casinoDisplayName} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state — fully empty */}
            {evOpps.length === 0 && arbOpps.length === 0 && !error && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
                <div className="mb-4 flex justify-center gap-3">
                  {/* Row of faded sport icons */}
                  {['NBA', 'NHL', 'NFL', 'MLB'].map((s) => (
                    <span key={s} className="text-slate-800">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9.5" />
                      </svg>
                    </span>
                  ))}
                </div>
                <p className="text-slate-400 font-semibold mb-2">No opportunities on the board right now.</p>
                <p className="text-slate-600 text-sm mb-4">
                  We&apos;re scanning every few minutes. The next play could surface any moment.
                </p>
                <Link
                  href="/learn"
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  While you wait, read the education guide to understand how +EV betting works.
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
