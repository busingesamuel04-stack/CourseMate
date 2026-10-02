import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle, Monitor, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type GuideType = 'none' | 'ios' | 'android-chrome' | 'desktop-chrome';

export const PWAInstallBanner: React.FC = () => {
  // Check for globally captured prompt from early inline script
  const initialPrompt =
    typeof window !== 'undefined'
      ? (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt || null
      : null;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(initialPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeGuide, setActiveGuide] = useState<GuideType>('none');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Platform & browser sniffing
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const isChromeBrowser = /chrome|crios/.test(ua) && !/edg|opr|samsungbrowser/.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsChrome(isChromeBrowser);

    // Check if dismissed in this session
    const isSessionDismissed = sessionStorage.getItem('coursemate_pwa_dismissed') === 'true';
    if (isSessionDismissed) {
      setDismissed(true);
    }

    // 1. Native beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      // If user hadn't permanently hidden it, keep it visible
    };

    // 2. Custom event dispatched from early inline script in index.html
    const handleCustomPrompt = (e: Event) => {
      const detail = (e as CustomEvent<BeforeInstallPromptEvent>).detail;
      if (detail) {
        setDeferredPrompt(detail);
      }
    };

    // 3. Global trigger to open install guide from anywhere in the app (TopBar, Profile, etc.)
    const handleOpenInstall = () => {
      setDismissed(false);
      handleInstallClick();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('coursemate:pwa-prompt', handleCustomPrompt);
    window.addEventListener('coursemate:open-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('coursemate:pwa-prompt', handleCustomPrompt);
      window.removeEventListener('coursemate:open-install', handleOpenInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    // If browser supports the native 1-tap installation prompt:
    const activePrompt =
      deferredPrompt ||
      (window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent }).__deferredPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          (window as unknown as { __deferredPrompt?: null }).__deferredPrompt = null;
          setDismissed(true);
        }
        return;
      } catch (err) {
        console.warn('[PWA] Prompt error, falling back to manual guidance:', err);
      }
    }

    // Fallback: Show tailored step-by-step guidance for the user's specific browser
    if (isIOS) {
      setActiveGuide('ios');
    } else if (isAndroid) {
      setActiveGuide('android-chrome');
    } else {
      setActiveGuide('desktop-chrome');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('coursemate_pwa_dismissed', 'true');
  };

  // Don't render banner if already installed or dismissed (modals can still open via event)
  const showBanner = !isStandalone && !dismissed;

  return (
    <>
      {/* Floating Modern Pill Banner — Dynamically offset beneath Dynamic Island & notches */}
      {showBanner && (
        <aside
          aria-label="Install App Banner"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.65rem)' }}
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[#141624]/95 backdrop-blur-2xl border border-indigo-500/35 shadow-2xl shadow-black/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  Install CourseMate App
                </h2>
                <span className="hidden xs:inline-block px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold text-[9px] rounded-md border border-emerald-500/30">
                  Offline Ready
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                {isIOS
                  ? 'Add to iPhone Home Screen'
                  : isAndroid
                  ? '1-tap install on Google Chrome & Android'
                  : 'Install fast desktop academic dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. GOOGLE CHROME (ANDROID) STEP-BY-STEP MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeGuide === 'android-chrome' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141624] border border-white/[0.1] w-full max-w-sm p-6 shadow-2xl rounded-3xl text-white space-y-4 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">How to Install in Google Chrome</h3>
                  <p className="text-[10px] text-zinc-400">Android &amp; Chrome Mobile</p>
                </div>
              </div>
              <button
                onClick={() => setActiveGuide('none')}
                className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="space-y-1">
                  <p>
                    Tap the <strong className="text-white">Three Dots Menu</strong> in Google Chrome&apos;s top-right corner:
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white font-mono text-[11px]">
                    <MoreVertical className="w-3.5 h-3.5 inline text-indigo-400" /> Chrome Menu (⋮)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <p>Scroll down the menu list and tap:</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold text-[11px]">
                    <Download className="w-3.5 h-3.5" /> Install app <span className="text-[10px] text-zinc-400 font-normal">or &quot;Add to Home screen&quot;</span>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <p>
                  Tap <strong className="text-white">Install</strong> on the confirmation pop-up. CourseMate will appear right in your phone&apos;s app drawer and home screen!
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveGuide('none')}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Understood, I&apos;ll install from Chrome menu</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. IPHONE / IPAD (SAFARI) STEP-BY-STEP MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeGuide === 'ios' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141624] border border-white/[0.1] w-full max-w-sm p-6 shadow-2xl rounded-3xl text-white space-y-4 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">How to Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setActiveGuide('none')}
                className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <p>
                  In Safari, tap the <strong className="text-white">Share</strong> button in the bottom toolbar:
                  <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                    <Share className="w-3 h-3 inline" /> Share
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <p>
                  Scroll down the menu options and tap:
                  <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                    <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <p>
                  Tap <strong className="text-white">Add</strong> in the top right corner. CourseMate will launch as a standalone app!
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveGuide('none')}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP GOOGLE CHROME / EDGE STEP-BY-STEP MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeGuide === 'desktop-chrome' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141624] border border-white/[0.1] w-full max-w-sm p-6 shadow-2xl rounded-3xl text-white space-y-4 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install on Desktop Chrome</h3>
                  <p className="text-[10px] text-zinc-400">Windows, macOS &amp; ChromeOS</p>
                </div>
              </div>
              <button
                onClick={() => setActiveGuide('none')}
                className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="space-y-1">
                  <p>
                    Look at the right side of the <strong className="text-white">URL Address Bar</strong> in Chrome:
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold text-[11px]">
                    <Download className="w-3.5 h-3.5" /> Install CourseMate icon
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <p>
                    Alternatively, click the <strong className="text-white">Chrome Menu (⋮)</strong> &gt; <strong className="text-white">Cast, save, and share</strong>:
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white font-mono text-[11px]">
                    Install CourseMate...
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveGuide('none')}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
