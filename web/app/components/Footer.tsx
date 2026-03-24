import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070c1a]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Main columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/20 border border-green-500/40 flex-shrink-0">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-base font-bold text-white">Local Casino Odds</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The only odds comparison tool built for local casino sportsbooks. Find the edge your book doesn&apos;t want you to see.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Tools</h3>
            <ul className="space-y-3">
              {[
                { href: '/dashboard', label: 'Live Dashboard' },
                { href: '/casinos', label: 'Casino Directory' },
                { href: '/odds', label: 'Odds Browser' },
                { href: '/dashboard', label: '+EV Finder' },
                { href: '/dashboard', label: 'Arbitrage Detector' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Learn</h3>
            <ul className="space-y-3">
              {[
                { href: '/learn#ev', label: '+EV Betting' },
                { href: '/learn#arbitrage', label: 'Arbitrage Betting' },
                { href: '/learn#odds', label: 'Reading Odds Formats' },
                { href: '/learn#vig', label: 'What Is Vig/Juice?' },
                { href: '/learn#local', label: 'Why Local Lines Are Different' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Company</h3>
            <ul className="space-y-3">
              {[
                { href: '/#pricing', label: 'Pricing' },
                { href: '/learn', label: 'Education Hub' },
                { href: '/#faq', label: 'FAQ' },
                { href: '/#signup', label: 'Join Waitlist' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Local Casino Odds. All rights reserved.
            </p>
            <div className="max-w-xl text-xs text-slate-600 sm:text-right leading-relaxed">
              <span className="font-semibold text-slate-500">21+ Bet Responsibly.</span> Sports betting involves risk.
              This platform provides data-driven analysis tools for informational purposes only.
              We do not facilitate wagering. Please gamble within your means. If you or someone you know
              has a gambling problem, call 1-800-522-4700.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
