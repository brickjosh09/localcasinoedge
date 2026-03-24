'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getEvents, getSports, Event, SportData } from '../lib/api';
import SportTabs from '../components/SportTabs';
import EventCard from '../components/EventCard';

// ─── SUBSCRIPTION FLAG ───
// Set to true when Stripe + auth is wired up. All data code below stays intact.
import { isBetaUser, activateBeta } from '../lib/auth';

// ─── PAYWALL GATE ───
function PaywallGate() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-green-500/4 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      {/* Page header */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Odds Browser</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1 ml-8">Subscribers-only — live odds from local casino sportsbooks</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg text-center">

          {/* Lock icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 shadow-2xl shadow-slate-950/60">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-transparent" />
              <svg className="relative h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>

          {/* Page context */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Odds Browser</p>

          {/* Headline */}
          <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Live Odds Browser
          </h2>

          {/* Description */}
          <p className="mb-8 text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
            Browse every event and line from your local casino sportsbooks in real time.
            Compare against sharp consensus odds.
          </p>

          {/* What's included */}
          <div className="mb-10 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">What subscribers see</p>
            <ul className="space-y-3">
              {[
                'Every event with live local casino lines',
                'Side-by-side comparison vs sharp consensus',
                'All sports: NBA, NFL, NHL, MLB, NCAAF, NCAAB',
                'Moneyline, spread, and totals markets',
                'Updated every few minutes',
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

export default function OddsPage() {
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

  return <OddsContent />;
}

function OddsContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sports, setSports] = useState<SportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSport, setActiveSport] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [eventsData, sportsData] = await Promise.all([
        getEvents({ sport: activeSport === 'all' ? undefined : activeSport, limit: 100 }),
        getSports(),
      ]);
      setEvents(eventsData);
      setSports(sportsData);
    } catch {
      setError('Could not connect to the API. Make sure the backend is running on port 8787.');
    } finally {
      setLoading(false);
    }
  }, [activeSport]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sportTabs = [
    { label: 'All Sports', value: 'all' },
    ...sports.map((s) => ({ label: s.sport, value: s.sport, count: s.event_count })),
  ];

  const filtered = events.filter((e) => {
    if (!search) return true;
    return e.event.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Odds Browser</h1>
              <p className="text-slate-400 text-sm mt-1">
                All events with current local casino lines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">Odds delayed up to 5 min</span>
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-black text-white tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 mb-6">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="flex-1">
            <SportTabs tabs={sportTabs} active={activeSport} onChange={setActiveSport} />
          </div>
        </div>

        <div className="mb-5">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-slate-500 mb-4 scoreboard-num">
            Showing {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 animate-pulse">
                <div className="h-3 bg-slate-800 rounded w-1/5 mb-3" />
                <div className="h-5 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Event list */}
        {!loading && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
                <p className="text-slate-500 font-medium mb-2">No events found</p>
                <p className="text-slate-600 text-sm">
                  {search ? 'Try a different search term.' : 'No events available for this sport right now.'}
                </p>
              </div>
            ) : (
              filtered.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
