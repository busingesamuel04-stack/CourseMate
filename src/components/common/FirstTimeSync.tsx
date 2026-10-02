import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const STATUS_MESSAGES = [
  "Establishing secure connection to portal...",
  "Waking up extraction engine...",
  "Syncing academic records...",
  "Building your dashboard...",
] as const;

export interface FirstTimeSyncProps {
  /**
   * Indicates whether the scraper background run is still executing.
   * When this flips from true to false, onComplete will be triggered.
   */
  isScrapePending: boolean;
  /**
   * Callback fired the moment isScrapePending transitions from true to false,
   * signaling that Supabase Realtime received the data and the dashboard is ready.
   */
  onComplete?: () => void;
}

/**
 * FirstTimeSync
 * ---------------------------------------------------------------------------
 * Full-screen loading screen designed to mask the ~45-second delay while
 * the GitHub Actions scraper extracts and syncs academic data for a new user.
 *
 * Cycles through 4 status messages every 8 seconds with smooth visual feedback
 * and fires onComplete once isScrapePending transitions from true to false.
 */
export const FirstTimeSync: React.FC<FirstTimeSyncProps> = ({
  isScrapePending,
  onComplete,
}) => {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out'>('fade-in');

  // Track previous value of isScrapePending to detect the true -> false edge transition
  const prevPendingRef = useRef<boolean>(isScrapePending);
  const hasTriggeredRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);

  // Keep latest onComplete reference
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cycle through statuses every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setCurrentStatusIndex((prevIndex) => (prevIndex + 1) % STATUS_MESSAGES.length);
        setFadeState('fade-in');
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Listen to isScrapePending: trigger onComplete the moment it flips from true to false
  useEffect(() => {
    if (isScrapePending) {
      // Re-enable trigger if a new scrape cycle begins
      hasTriggeredRef.current = false;
    } else if (prevPendingRef.current === true && !isScrapePending && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onCompleteRef.current?.();
    }
    prevPendingRef.current = isScrapePending;
  }, [isScrapePending]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090A0E] text-white px-6 select-none overflow-hidden"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14)_0%,transparent_65%)] pointer-events-none" />

      {/* Subtle ambient light glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md bg-[#13141D]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center">
        {/* Pulsing Loading Spinner Container */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Pulsing Glow Aura */}
          <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/25 to-violet-500/25 blur-xl animate-pulse" />

          {/* Primary Spinning Ring */}
          <div className="w-20 h-20 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin" />

          {/* Secondary Counter-Rotating Ring */}
          <div
            className="absolute w-14 h-14 rounded-full border-2 border-violet-500/20 border-b-violet-400 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '2s' }}
          />

          {/* Core Pulsing Icon Badge */}
          <div className="absolute flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/40 animate-pulse">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-4 tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          First-Time Setup
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Syncing Academic Portal
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed max-w-xs">
          Fetching your registered courses, exam timetable, and academic history from the portal.
        </p>

        {/* Status cycling text element */}
        <div className="w-full min-h-[52px] flex items-center justify-center px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
          <p
            key={currentStatusIndex}
            className={`text-sm font-medium text-indigo-200 transition-opacity duration-300 ease-in-out ${
              fadeState === 'fade-in' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {STATUS_MESSAGES[currentStatusIndex]}
          </p>
        </div>

        {/* Stepper Dots (4 stages) */}
        <div className="flex items-center gap-2 mb-4">
          {STATUS_MESSAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentStatusIndex
                  ? 'w-6 bg-indigo-500 shadow-sm shadow-indigo-500/50'
                  : idx < currentStatusIndex
                  ? 'w-2 bg-indigo-400/60'
                  : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Duration hint */}
        <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 mt-2">
          <span>Initial sync takes approx. 45 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeSync;
