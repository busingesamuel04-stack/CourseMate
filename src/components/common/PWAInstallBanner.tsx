import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user previously dismissed banner in this session
    const isDismissed = sessionStorage.getItem('coursemate_pwa_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }

    // Listen for the native beforeinstallprompt on Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instruction if prompt isn't supported directly
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('coursemate_pwa_dismissed', 'true');
  };

  // Don't render if already installed or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Modern Pill Banner on Mobile / Desktop */}
      <aside 
        aria-label="Install App Banner"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[#161825]/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/25">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white truncate">Install CourseMate App</h2>
            <p className="text-[11px] text-zinc-400 truncate">
              {isIOS ? 'Add to Home Screen for offline access' : 'Fast 1-tap install on your phone'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Visual Instruction Modal for iOS / Safari / Fallback */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141624] border border-white/[0.1] w-full max-w-sm p-6 shadow-2xl rounded-3xl text-white space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">How to Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <p>
                  Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar:
                  <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                    <Share className="w-3 h-3 inline" /> Share
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <p>
                  Scroll down the menu and tap:
                  <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                    <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <p>
                  Tap <strong className="text-white">Add</strong> in the top right corner. That's it!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
