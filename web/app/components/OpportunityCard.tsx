import { Opportunity } from '../lib/api';
import {
  formatOdds,
  formatEV,
  formatProb,
  formatTime,
  formatMarket,
  formatSelection,
  evBadgeClass,
} from '../lib/format';
import { SportIcon, TrophyIcon } from './SportIcons';

interface Props {
  opp: Opportunity;
  isBest?: boolean;
  casinoName?: string;
}

/**
 * Convert American odds to decimal odds
 */
function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

/**
 * Calculate Kelly Criterion bet size as a fraction of bankroll (capped at 15%)
 */
function kellyFraction(tbOdds: number, trueProb: number): number | null {
  if (!trueProb || trueProb <= 0 || trueProb >= 1) return null;
  const decimal = americanToDecimal(tbOdds);
  const b = decimal - 1;
  if (b <= 0) return null;
  const p = trueProb;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  if (kelly <= 0) return null;
  return Math.min(kelly * 0.25, 0.15);
}

export default function OpportunityCard({ opp, isBest = false, casinoName = 'Local Casino' }: Props) {
  const isHighEV = opp.ev_percent >= 3;
  const isArb = opp.is_arb;
  const kelly = isArb ? null : kellyFraction(opp.tb_odds, opp.true_prob);

  // Border/background based on type
  const cardClass = isArb
    ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/8'
    : isHighEV
    ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/8'
    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60';

  // Left accent color stripe
  const stripeColor = isArb
    ? 'bg-amber-500'
    : isHighEV
    ? 'bg-green-500'
    : 'bg-slate-600';

  return (
    <div
      className={`rounded-xl border transition-all hover:border-opacity-60 relative overflow-hidden ${cardClass}`}
    >
      {/* Left colored stripe — ticket aesthetic */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripeColor} opacity-70`} />

      {/* Perforated vertical line after the stripe */}
      <div
        className="absolute left-4 top-3 bottom-3 w-px pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(100,116,139,0.2) 3px, rgba(100,116,139,0.2) 6px)',
        }}
      />

      <div className="pl-7 pr-4 sm:pr-5 pt-4 pb-4 sm:pt-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {/* Meta row: sport icon + name + time + badges */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <SportIcon sport={opp.sport} className="h-3.5 w-3.5" />
                {opp.sport}
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">{formatTime(opp.start_time)}</span>
              {isArb && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  ARB
                </span>
              )}
              {isHighEV && !isArb && (
                <span className="rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-xs font-semibold text-green-400">
                  HIGH VALUE
                </span>
              )}
              {isBest && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  <TrophyIcon className="h-3 w-3" />
                  BEST EDGE
                </span>
              )}
            </div>

            {/* Event name — ticket header style */}
            <h3 className="text-base font-semibold text-white leading-snug">{opp.event}</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {formatMarket(opp.market)} — {formatSelection(opp.selection, opp.tb_line)}
            </p>
          </div>

          {/* EV badge — scoreboard style */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className={`rounded-lg px-4 py-2 text-2xl font-black scoreboard-num ${evBadgeClass(opp.ev_percent)}`}>
              {formatEV(opp.ev_percent)}
            </span>
            {kelly !== null && (
              <span className="text-xs text-slate-500 pr-0.5">
                Kelly: <span className="text-amber-400 font-semibold scoreboard-num">{(kelly * 100).toFixed(1)}%</span> of bankroll
              </span>
            )}
          </div>
        </div>

        {/* Odds comparison — scoreboard style numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`rounded-lg px-3 py-2.5 border ${
            !isArb && opp.ev_percent > 0
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="text-xs text-slate-500 mb-1">{casinoName}</div>
            <div className={`text-lg font-bold font-mono scoreboard-num ${!isArb && opp.ev_percent > 0 ? 'text-green-300' : 'text-white'}`}>
              {formatOdds(opp.tb_odds)}
            </div>
            {opp.tb_line !== null && (
              <div className="text-xs text-slate-500 font-mono scoreboard-num">Line: {opp.tb_line}</div>
            )}
          </div>

          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2.5">
            <div className="text-xs text-slate-500 mb-1 capitalize">{opp.sharp_book}</div>
            <div className="text-lg font-bold font-mono scoreboard-num text-slate-300">{formatOdds(opp.sharp_odds)}</div>
            {opp.sharp_line !== null && (
              <div className="text-xs text-slate-500 font-mono scoreboard-num">Line: {opp.sharp_line}</div>
            )}
          </div>

          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2.5">
            <div className="text-xs text-slate-500 mb-1">True Probability</div>
            <div className="text-lg font-bold font-mono scoreboard-num text-slate-200">{formatProb(opp.true_prob)}</div>
            <div className="text-xs text-slate-600">no-vig</div>
          </div>

          {isArb && opp.arb_profit > 0 ? (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
              <div className="text-xs text-amber-500/70 mb-1">Guaranteed Profit</div>
              <div className="text-lg font-bold font-mono scoreboard-num text-amber-400">+{opp.arb_profit.toFixed(2)}%</div>
              <div className="text-xs text-amber-600">both sides</div>
            </div>
          ) : kelly !== null ? (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
              <div className="text-xs text-amber-500/70 mb-1">Kelly Bet Size</div>
              <div className="text-lg font-bold font-mono scoreboard-num text-amber-400">{(kelly * 100).toFixed(1)}%</div>
              <div className="text-xs text-amber-600/70">of bankroll</div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2.5">
              <div className="text-xs text-slate-500 mb-1">Edge</div>
              <div className={`text-lg font-bold font-mono scoreboard-num ${opp.ev_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatEV(opp.ev_percent)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
