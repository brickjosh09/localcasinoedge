'use client';

import { useState } from 'react';
import { Event } from '../lib/api';
import { formatOdds, formatTime, formatMarket, formatEV, evColorClass } from '../lib/format';
import { SportIcon } from './SportIcons';

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(false);

  const bestEV = event.markets.reduce((best, m) => {
    if (m.ev_percent !== null && m.ev_percent > best) return m.ev_percent;
    return best;
  }, -Infinity);

  const hasSomeEV = bestEV > 0;

  return (
    <div className={`rounded-xl border transition-colors ${
      hasSomeEV ? 'border-green-500/20 hover:border-green-500/40' : 'border-slate-800 hover:border-slate-700'
    } bg-slate-900/40 relative overflow-hidden`}>

      {/* Left accent stripe for +EV events */}
      {hasSomeEV && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 opacity-60" />
      )}

      {/* Header */}
      <button
        className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Sport icon */}
            <span className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wide">
              <SportIcon sport={event.sport} className="h-3.5 w-3.5" />
              {event.sport}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">{formatTime(event.start_time)}</span>
          </div>
          <h3 className="text-base font-semibold text-white">{event.event}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{event.markets.length} market{event.markets.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {hasSomeEV && bestEV !== -Infinity && (
            <span className={`text-sm font-bold scoreboard-num ${evColorClass(bestEV)}`}>
              Best: {formatEV(bestEV)}
            </span>
          )}
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Markets */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 sm:px-5 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left pb-3 pr-4">Market</th>
                  <th className="text-left pb-3 pr-4">Selection</th>
                  <th className="text-right pb-3 pr-4">Local Casino</th>
                  <th className="text-right pb-3 pr-4">Sharp</th>
                  <th className="text-right pb-3">EV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {event.markets.map((m, i) => (
                  <tr key={i} className={`hover:bg-slate-800/20 ${m.ev_percent !== null && m.ev_percent > 0 ? 'bg-green-500/3' : ''}`}>
                    <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">
                      {formatMarket(m.market)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300 whitespace-nowrap capitalize">
                      {m.selection}{m.tb_line !== null ? ` ${m.tb_line}` : ''}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono font-semibold text-white whitespace-nowrap scoreboard-num">
                      {formatOdds(m.tb_odds)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-slate-400 whitespace-nowrap scoreboard-num">
                      {m.sharp_odds !== null ? formatOdds(m.sharp_odds) : '—'}
                      {m.sharp_book && (
                        <span className="ml-1 text-xs text-slate-600 capitalize">({m.sharp_book})</span>
                      )}
                    </td>
                    <td className={`py-2.5 text-right font-semibold whitespace-nowrap scoreboard-num ${
                      m.ev_percent !== null ? evColorClass(m.ev_percent) : 'text-slate-600'
                    }`}>
                      {m.ev_percent !== null ? formatEV(m.ev_percent) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
