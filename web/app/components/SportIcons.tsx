/**
 * Inline SVG sport icons — clean line-art style
 * No external icon libraries required
 */

interface IconProps {
  className?: string;
}

export function BasketballIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 2.5a14.5 14.5 0 0 1 4 10 14.5 14.5 0 0 1-4 10" />
      <path d="M12 2.5a14.5 14.5 0 0 0-4 10 14.5 14.5 0 0 0 4 10" />
      <path d="M2.5 12h19" />
    </svg>
  );
}

export function FootballIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-30 12 12)" />
      <path d="M7.5 7.5 16.5 16.5" />
      <path d="M10 6l-.5 3.5M14 17.5l-.5 3.5" opacity="0.6" />
      <path d="M6 10l3.5-.5M14.5 14.5l3.5-.5" opacity="0.6" />
    </svg>
  );
}

export function BaseballIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M5.5 6.5C7 8 7.5 10 7.5 12s-.5 4-2 5.5" />
      <path d="M18.5 6.5C17 8 16.5 10 16.5 12s.5 4 2 5.5" />
    </svg>
  );
}

export function HockeyIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Hockey stick */}
      <line x1="6" y1="3" x2="6" y2="15" />
      <path d="M6 15 C6 18 8 19.5 11 19.5 L15 19.5" />
      {/* Puck */}
      <ellipse cx="18" cy="21" rx="3" ry="1.5" />
    </svg>
  );
}

export function SoccerIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="12,6 14.5,8.5 13.5,11.5 10.5,11.5 9.5,8.5" />
      <path d="M9.5 8.5 6 7" />
      <path d="M14.5 8.5 18 7" />
      <path d="M10.5 11.5 8 15" />
      <path d="M13.5 11.5 16 15" />
      <path d="M8 15 10 17" />
      <path d="M16 15 14 17" />
    </svg>
  );
}

export function TrophyIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v6a6 6 0 0 1-12 0V4z" />
      <path d="M6 6H3a2 2 0 0 0 0 4c0 2 1 3 3 3.5" />
      <path d="M18 6h3a2 2 0 0 1 0 4c0 2-1 3-3 3.5" />
      <path d="M12 16v4" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function TicketIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a1 1 0 0 1 0-2V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
      <line x1="9" y1="4" x2="9" y2="14" strokeDasharray="2 2" />
    </svg>
  );
}

export function StarIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

/**
 * Returns the appropriate sport icon component for a given sport string
 */
export function SportIcon({ sport, className }: { sport: string; className?: string }) {
  const s = sport.toLowerCase();
  if (s.includes('basket') || s === 'nba' || s === 'ncaab') return <BasketballIcon className={className} />;
  if (s.includes('foot') || s === 'nfl' || s === 'ncaaf') return <FootballIcon className={className} />;
  if (s.includes('base') || s === 'mlb') return <BaseballIcon className={className} />;
  if (s.includes('hockey') || s === 'nhl') return <HockeyIcon className={className} />;
  if (s.includes('soccer') || s === 'mls') return <SoccerIcon className={className} />;
  // Default: small dash/circle for unknown sports
  return (
    <svg className={className ?? 'h-5 w-5'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
