'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const DEFAULT_MARKET = 'ms_gulf_coast';
const STORAGE_KEY = 'lco_selected_market';

interface MarketContextValue {
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;
}

const MarketContext = createContext<MarketContextValue>({
  selectedMarket: DEFAULT_MARKET,
  setSelectedMarket: () => {},
});

export function MarketProvider({ children }: { children: ReactNode }) {
  const [selectedMarket, setSelectedMarketState] = useState<string>(DEFAULT_MARKET);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSelectedMarketState(stored);
    } catch {
      // ignore
    }
  }, []);

  function setSelectedMarket(market: string) {
    setSelectedMarketState(market);
    try {
      localStorage.setItem(STORAGE_KEY, market);
    } catch {
      // ignore
    }
  }

  return (
    <MarketContext.Provider value={{ selectedMarket, setSelectedMarket }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
