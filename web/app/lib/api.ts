const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface StatusData {
  sports_count: number;
  events_count: number;
  snapshots_count: number;
  last_scrape_time: string | null;
}

export interface Opportunity {
  event: string;
  sport: string;
  start_time: string;
  market: string;
  selection: string;
  tb_odds: number;
  tb_line: number | null;
  sharp_odds: number;
  sharp_book: string;
  sharp_line: number | null;
  true_prob: number;
  ev_percent: number;
  is_arb: boolean;
  arb_profit: number;
}

export interface Event {
  event_id: string;
  event: string;
  sport: string;
  start_time: string;
  markets: Market[];
}

export interface Market {
  market: string;
  selection: string;
  tb_odds: number;
  tb_line: number | null;
  sharp_odds: number | null;
  sharp_book: string | null;
  ev_percent: number | null;
}

export interface SportData {
  sport: string;
  event_count: number;
}

export interface OddsHistory {
  event_id: string;
  event: string;
  sport: string;
  start_time: string;
  snapshots: OddsSnapshot[];
}

export interface OddsSnapshot {
  timestamp: string;
  market: string;
  selection: string;
  tb_odds: number;
  tb_line: number | null;
}

export interface MarketData {
  id: string;
  name: string;
  state: string;
  region: string;
  casino_count: number;
  active_count: number;
  coming_soon_count: number;
}

export interface CasinoData {
  id: string;
  name: string;
  short_name: string;
  location: string;
  platform: string;
  status: 'active' | 'coming_soon';
  bet_url: string | null;
  notes: string | null;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getStatus(): Promise<StatusData> {
  return apiFetch<StatusData>('/api/status');
}

export async function getOpportunities(params?: {
  min_ev?: number;
  sport?: string;
}): Promise<Opportunity[]> {
  const query = new URLSearchParams();
  if (params?.min_ev !== undefined) query.set('min_ev', String(params.min_ev));
  if (params?.sport) query.set('sport', params.sport);
  const qs = query.toString();
  return apiFetch<Opportunity[]>(`/api/opportunities${qs ? `?${qs}` : ''}`);
}

export async function getEvents(params?: {
  sport?: string;
  limit?: number;
}): Promise<Event[]> {
  const query = new URLSearchParams();
  if (params?.sport) query.set('sport', params.sport);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Event[]>(`/api/events${qs ? `?${qs}` : ''}`);
}

export async function getSports(): Promise<SportData[]> {
  return apiFetch<SportData[]>('/api/sports');
}

export async function getOddsHistory(eventId: string): Promise<OddsHistory> {
  return apiFetch<OddsHistory>(`/api/odds?event_id=${eventId}`);
}

export async function getMarkets(): Promise<MarketData[]> {
  const data = await apiFetch<{ markets: MarketData[] }>('/api/markets');
  return data.markets;
}

export async function getCasinos(market: string): Promise<CasinoData[]> {
  const data = await apiFetch<{ casinos: CasinoData[] }>(`/api/casinos?market=${encodeURIComponent(market)}`);
  return data.casinos;
}
