'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMarkets, getCasinos, MarketData, CasinoData } from '../lib/api';
import { useMarket } from '../lib/MarketContext';

function StatusBadge({ status }: { status: CasinoData['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/40 px-3 py-1 text-xs font-bold text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400/80">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
      COMING SOON
    </span>
  );
}

function CasinoCard({ casino }: { casino: CasinoData }) {
  const isActive = casino.status === 'active';

  return (
    <div
      className={`rounded-xl border relative overflow-hidden transition-all ${
        isActive
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/8 to-slate-900/60 hover:border-green-500/50 hover:from-green-500/12'
          : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600/60 opacity-75 hover:opacity-90'
      }`}
    >
      {/* Active casino: subtle left stripe */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 opacity-70" />
      )}

      <div className={`p-5 ${isActive ? 'pl-6' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className={`font-bold text-base leading-snug ${isActive ? 'text-white' : 'text-slate-300'}`}>
              {casino.name}
            </h3>
            {casino.location && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="h-3 w-3 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-slate-500">{casino.location}</span>
              </div>
            )}
          </div>
          <StatusBadge status={casino.status} />
        </div>

        {/* Platform */}
        {casino.platform && (
          <div className="mb-3">
            <span className="inline-block rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400 font-medium">
              {casino.platform}
            </span>
          </div>
        )}

        {/* Notes */}
        {casino.notes && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4">{casino.notes}</p>
        )}

        {/* CTA */}
        {isActive && casino.bet_url ? (
          <a
            href={casino.bet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            Visit Sportsbook
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : !isActive ? (
          <span className="text-xs text-slate-600">Monitoring — will go live when available</span>
        ) : null}
      </div>
    </div>
  );
}

const PLACEHOLDER_MARKETS = [
  { id: 'la_casino', name: 'Louisiana Casinos', state: 'Louisiana', region: 'Gulf South' },
  { id: 'nv_las_vegas', name: 'Las Vegas Strip', state: 'Nevada', region: 'Southwest' },
  { id: 'nj_atlantic_city', name: 'Atlantic City', state: 'New Jersey', region: 'Northeast' },
  { id: 'in_casino', name: 'Indiana Casinos', state: 'Indiana', region: 'Midwest' },
];

export default function CasinosPage() {
  const { selectedMarket, setSelectedMarket } = useMarket();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [casinos, setCasinos] = useState<CasinoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [marketsData, casinosData] = await Promise.all([
          getMarkets(),
          getCasinos(selectedMarket),
        ]);
        setMarkets(marketsData);
        setCasinos(casinosData);
      } catch {
        setError('Could not load casino data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedMarket]);

  const activeMarket = markets.find((m) => m.id === selectedMarket);
  const activeCasinos = casinos.filter((c) => c.status === 'active');
  const comingSoonCasinos = casinos.filter((c) => c.status === 'coming_soon');

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Casino Directory</p>
              <h1 className="text-3xl font-bold text-white mb-2">
                {activeMarket ? activeMarket.name : 'Local Casinos'}
              </h1>
              <p className="text-slate-400 text-sm max-w-lg">
                Every sportsbook we track in your market — with real-time odds scanning for active casinos.
              </p>
            </div>

            {/* Market selector */}
            <div className="flex-shrink-0">
              <label className="text-xs text-slate-500 mb-1.5 block">Selected Market</label>
              <div className="flex flex-wrap gap-2">
                {markets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarket(m.id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedMarket === m.id
                        ? 'border-green-500/50 bg-green-500/15 text-green-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
                {/* Placeholder coming-soon markets */}
                {PLACEHOLDER_MARKETS.map((m) => (
                  <button
                    key={m.id}
                    disabled
                    className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-700 cursor-not-allowed"
                    title="Coming soon"
                  >
                    {m.state}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2">More states coming soon</p>
            </div>
          </div>

          {/* Stats strip */}
          {activeMarket && (
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Total Tracked</span>
                <div className="text-2xl font-black text-white scoreboard-num">{activeMarket.casino_count}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Live Now</span>
                <div className="text-2xl font-black text-green-400 scoreboard-num">{activeMarket.active_count}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Coming Soon</span>
                <div className="text-2xl font-black text-amber-400/80 scoreboard-num">{activeMarket.coming_soon_count}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 mb-8">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* Active casinos */}
            {activeCasinos.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-5 w-1 rounded-full bg-green-500" />
                  <h2 className="text-lg font-semibold text-white">
                    Live Now
                    <span className="ml-2 text-sm font-normal text-slate-500">({activeCasinos.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeCasinos.map((casino) => (
                    <CasinoCard key={casino.id} casino={casino} />
                  ))}
                </div>
              </section>
            )}

            {/* Coming soon casinos */}
            {comingSoonCasinos.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-5 w-1 rounded-full bg-amber-500/70" />
                  <h2 className="text-lg font-semibold text-slate-400">
                    Coming Soon
                    <span className="ml-2 text-sm font-normal text-slate-600">({comingSoonCasinos.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {comingSoonCasinos.map((casino) => (
                    <CasinoCard key={casino.id} casino={casino} />
                  ))}
                </div>
              </section>
            )}

            {/* Request a Casino CTA */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-8 text-center mt-6">
              <div className="mb-3">
                <svg className="h-8 w-8 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-white mb-2">Don&apos;t see your casino?</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  We&apos;re actively adding more casino sportsbooks across the country. Let us know which casino you want covered.
                </p>
              </div>
              <a
                href="/#signup"
                className="inline-flex items-center gap-2 rounded-lg border border-green-600/50 px-6 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-600/20 transition-colors mt-4"
              >
                Request a Casino
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Back to dashboard */}
            <div className="mt-8 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Live Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
