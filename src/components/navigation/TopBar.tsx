import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Plus,
  Smartphone,
  Maximize2,
  Sparkles,
  Calendar,
  WifiOff,
  Download,
} from 'lucide-react';
import { TabType } from '../../types';
import { exportScheduleToIcs } from '../../utils/calendarExport';

export const TopBar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    student,
    courses,
    events,
    unreadNotificationsCount,
    viewportMode,
    setViewportMode,
    openModal,
    simulationState,
    setSimulationState,
  } = useApp();

  const [calendarToast, setCalendarToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleExportCalendar = () => {
    const res = exportScheduleToIcs(courses, events, student?.name || 'Student');
    if (res.success) {
      setCalendarToast('Academic schedule exported to .ics — tap to add to Google/Apple Calendar');
      setTimeout(() => setCalendarToast(null), 4000);
    }
  };

  const navLinks: { label: string; tab: TabType }[] = [
    { label: 'Home', tab: 'home' },
    { label: 'Planner', tab: 'planner' },
    { label: 'Courses', tab: 'courses' },
    { label: 'Study', tab: 'study' },
    { label: 'Campus', tab: 'campus' },
    { label: 'Profile', tab: 'profile' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 w-full bg-[#090A0E]/95 backdrop-blur-2xl border-b border-white/[0.08] transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]">
        {/* Zone 1: CourseMate Wordmark & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 group text-left focus:outline-none select-none cursor-pointer"
            title="CourseMate Home"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-sm sm:text-base group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/25 shrink-0">
              C
            </div>
            <div className="leading-tight">
              <span className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                CourseMate
              </span>
              <span className="block text-[8.5px] sm:text-[10px] font-semibold text-indigo-400/90 tracking-wider uppercase leading-none mt-0.5">
                Academic Command
              </span>
            </div>
          </button>

          {/* Compact Simulation Quick Switcher (Discreet & Non-overlapping) */}
          <div className="hidden 2xl:flex items-center pl-3 border-l border-white/[0.08] text-zinc-400 gap-1 text-[11px]">
            <span className="text-zinc-500 font-medium">State:</span>
            {(['normal', 'loading', 'empty', 'error'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSimulationState(st)}
                className={`px-2 py-0.5 rounded-full capitalize text-[10px] font-bold transition-all ${
                  simulationState === st
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Zone 2: Navigation Links (Cleanly centered for wide screens, no collisions) */}
        <nav
          aria-label="Desktop Navigation"
          className="hidden xl:flex items-center gap-1 p-1 rounded-full bg-[#13141F] border border-white/[0.08] shrink-0"
        >
          {navLinks.map(({ label, tab }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`relative px-4 py-1.5 text-xs font-bold tracking-tight transition-all rounded-full whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Affordances (Clutter-free, perfect responsive fitting) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Viewport Frame Switcher (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center bg-[#13141F] border border-white/[0.08] p-0.5 rounded-full">
            <button
              onClick={() => setViewportMode('mobile-mockup')}
              className={`p-1.5 px-2.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                viewportMode === 'mobile-mockup'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Switch to Mobile Frame (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Mobile</span>
            </button>
            <button
              onClick={() => setViewportMode('responsive')}
              className={`p-1.5 px-2.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                viewportMode === 'responsive'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Switch to Fullscreen Responsive"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Desktop</span>
            </button>
          </div>

          {/* Offline Mode Indicator Pill */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold shrink-0 animate-in fade-in duration-300"
              title="No internet connection — showing cached data"
              aria-live="assertive"
              aria-label="Offline mode active"
            >
              <WifiOff className="h-3 w-3 shrink-0 animate-pulse" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* AI Study Assistant Button */}
          <button
            onClick={() => openModal('ai-assistant')}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3.5 text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Open Gemini AI Study Assistant"
            aria-label="Open AI Tutor"
          >
            <Sparkles className="h-3.5 w-3.5 fill-white text-white shrink-0" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>

          {/* PWA Install Trigger button (Visible on all devices, triggers prompt or Chrome guide) */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('coursemate:open-install'))}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            title="Install CourseMate PWA on your device"
            aria-label="Install App"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px]">Install</span>
          </button>

          {/* Quick Add Action */}
          <button
            onClick={() => openModal('add-task')}
            className="bg-white hover:bg-zinc-100 text-black flex h-8 sm:h-9 items-center justify-center gap-1 rounded-full px-2.5 sm:px-3.5 text-xs font-bold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Add Task or Event"
            aria-label="Add Task or Event"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* 1-Tap Calendar Export (.ics) */}
          <button
            onClick={handleExportCalendar}
            className="hidden md:flex bg-[#13141F] hover:bg-[#1E202E] border border-white/[0.08] text-zinc-300 hover:text-white h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            title="Export Academic Schedule to .ics (Google & Apple Calendar)"
            aria-label="Export Academic Schedule to Calendar"
          >
            <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px]">.ics</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => openModal('notifications')}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#13141F] hover:bg-[#1E202E] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {unreadNotificationsCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9.5px] font-black text-white shadow-sm ring-2 ring-[#0B0C15] animate-in zoom-in duration-150"
                aria-label={`${unreadNotificationsCount} unread alerts`}
              >
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Student Profile Quick Trigger */}
          <button
            onClick={() => setCurrentTab('profile')}
            className="flex items-center rounded-full focus:outline-none shrink-0 cursor-pointer"
            title="View Student Profile"
            aria-label="View Student Profile"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#13141F] hover:bg-[#1E202E] border border-white/[0.08] text-white font-bold text-xs shadow-md transition-colors">
              {(student?.name || 'Guest')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('') || 'G'}
            </div>
          </button>
        </div>
      </div>

      {/* Calendar Export Toast Notification */}
      {calendarToast && (
        <div
          role="status"
          className="absolute top-16 left-1/2 -translate-x-1/2 mt-2 px-4 py-2.5 rounded-xl bg-[#1E202E]/95 border border-indigo-500/30 text-xs text-indigo-200 shadow-xl shadow-indigo-950/50 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 pointer-events-auto"
        >
          <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium">{calendarToast}</span>
          <button
            onClick={() => setCalendarToast(null)}
            className="ml-2 text-zinc-400 hover:text-white text-sm font-bold leading-none cursor-pointer"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </header>
  );
};
