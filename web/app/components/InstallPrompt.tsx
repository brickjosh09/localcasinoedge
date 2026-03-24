'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Check if already dismissed
    if (localStorage.getItem('lco_install_dismissed')) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Android/Chrome: capture the install event
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('lco_install_dismissed', '1');
  };

  // Not showing anything
  if (dismissed) return null;
  if (!prompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-2xl border border-green-800/50 bg-slate-900/95 shadow-2xl shadow-black/60 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-600/20">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Install Local Casino Odds</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Add to your home screen for quick access at the casino.
            </p>
            {showIOSInstructions && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Tap the <span className="font-semibold text-white">Share</span> button at the bottom of Safari, then tap <span className="font-semibold text-white">Add to Home Screen</span>.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="ml-1 text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {isIOS ? (
            <button
              onClick={() => setShowIOSInstructions(!showIOSInstructions)}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              How to Install
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              Install App
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
