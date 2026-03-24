'use client';

import { SportIcon } from './SportIcons';

interface SportTab {
  label: string;
  value: string;
  count?: number;
}

interface Props {
  tabs: SportTab[];
  active: string;
  onChange: (value: string) => void;
}

export default function SportTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        const isAll = tab.value === 'all';
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {/* Sport icon for non-"all" tabs */}
            {!isAll && (
              <span className={`flex-shrink-0 ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                <SportIcon sport={tab.value} className="h-4 w-4" />
              </span>
            )}
            {isAll && (
              /* Grid of tiny dots for "All Sports" */
              <span className={`flex-shrink-0 ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="3" cy="3" r="1.5" />
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="13" cy="3" r="1.5" />
                  <circle cx="3" cy="8" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="13" cy="8" r="1.5" />
                  <circle cx="3" cy="13" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                  <circle cx="13" cy="13" r="1.5" />
                </svg>
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-slate-600 text-slate-200'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
