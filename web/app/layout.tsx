import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';
import InstallPrompt from './components/InstallPrompt';
import { MarketProvider } from './lib/MarketContext';

export const metadata: Metadata = {
  title: 'Local Casino Odds — Find Your Edge at Local Sportsbooks',
  description:
    "The only odds comparison tool built for local casino sportsbooks. Find +EV opportunities and arbitrage bets that the major tools miss.",
  keywords: [
    'sports betting',
    'odds comparison',
    '+EV',
    'arbitrage',
    'local casino',
    'local sportsbook',
    'casino odds',
    'sports betting edge',
    'positive expected value',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Local Casino Odds',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0a0f1e" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-[#0a0f1e] text-slate-200">
        <MarketProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </MarketProvider>
      </body>
    </html>
  );
}
