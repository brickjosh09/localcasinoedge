/**
 * Format American odds with +/- sign
 */
export function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`;
  return String(odds);
}

/**
 * Format EV percentage with +/- sign
 */
export function formatEV(ev: number): string {
  const sign = ev >= 0 ? '+' : '';
  return `${sign}${ev.toFixed(1)}%`;
}

/**
 * Format probability as percentage
 */
export function formatProb(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

/**
 * Format start time as readable local string
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format last scrape time as relative
 */
export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

/**
 * Get EV color class
 */
export function evColorClass(ev: number): string {
  if (ev >= 3) return 'text-green-400';
  if (ev >= 1) return 'text-green-600';
  if (ev >= 0) return 'text-slate-400';
  return 'text-red-400';
}

/**
 * Get EV badge class (background)
 */
export function evBadgeClass(ev: number): string {
  if (ev >= 3) return 'bg-green-500/20 text-green-400 border border-green-500/40';
  if (ev >= 1) return 'bg-green-900/30 text-green-600 border border-green-700/40';
  return 'bg-slate-800 text-slate-400 border border-slate-700';
}

/**
 * Format market type nicely
 */
export function formatMarket(market: string): string {
  const map: Record<string, string> = {
    moneyline: 'Moneyline',
    spread: 'Spread',
    total: 'Total',
    h2h: 'Moneyline',
    over_under: 'Total',
  };
  return map[market.toLowerCase()] ?? market;
}

/**
 * Format selection nicely (capitalize, add line if present)
 */
export function formatSelection(selection: string, line: number | null): string {
  const cap = selection.charAt(0).toUpperCase() + selection.slice(1);
  if (line !== null && line !== undefined) return `${cap} ${line}`;
  return cap;
}
