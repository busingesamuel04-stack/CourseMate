import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Calendar,
  Home,
  BookOpen,
  Flame,
  Bell,
  X,
} from 'lucide-react';
import { TabType } from '../../types';

export const InformationFlowBanner: React.FC = () => {
  const {
    activeFlowConsequence,
    clearFlowConsequence,
    setCurrentTab,
    openModal,
    courses,
  } = useApp();

  if (!activeFlowConsequence) return null;

  const { triggerEventTitle, courseCode, consequences } = activeFlowConsequence;

  const navigateToTab = (tab: TabType) => {
    setCurrentTab(tab);
    clearFlowConsequence();
  };

  const navigateToCourse = () => {
    const course = courses.find((c) => c.code === courseCode);
    if (course) {
      openModal('course-detail', course);
    } else {
      setCurrentTab('courses');
    }
    clearFlowConsequence();
  };

  const navigateToNotifications = () => {
    openModal('notifications');
    clearFlowConsequence();
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-lg w-[calc(100%-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#13141D]/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 border border-white/[0.12] text-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 fill-white" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>System Flow Synchronized</span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold">
                  {courseCode}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[240px] sm:max-w-xs">
                "{triggerEventTitle}"
              </p>
            </div>
          </div>

          <button
            onClick={clearFlowConsequence}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Dismiss trace"
            aria-label="Dismiss flow notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5-Pillar Consequence Ripple List */}
        <div className="space-y-1.5 text-[11px]">
          {/* 1. Planner */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-zinc-200 font-medium truncate">
                {consequences.planner}
              </span>
            </div>
            <button
              onClick={() => navigateToTab('planner')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
            >
              Planner &rarr;
            </button>
          </div>

          {/* 2. Home */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-zinc-200 font-medium truncate">
                {consequences.home}
              </span>
            </div>
            <button
              onClick={() => navigateToTab('home')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
            >
              Home &rarr;
            </button>
          </div>

          {/* 3. Courses */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-200 font-medium truncate">
                {consequences.courses}
              </span>
            </div>
            <button
              onClick={navigateToCourse}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
            >
              Course &rarr;
            </button>
          </div>

          {/* 4. Study */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <Flame className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-200 font-medium truncate">
                {consequences.study}
              </span>
            </div>
            <button
              onClick={() => navigateToTab('study')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
            >
              Study &rarr;
            </button>
          </div>

          {/* 5. Notifications */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-200 font-medium truncate">
                {consequences.notifications}
              </span>
            </div>
            <button
              onClick={navigateToNotifications}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0"
            >
              Alerts &rarr;
            </button>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
          <span>Unified Cross-Module State Propagation</span>
          <button
            onClick={clearFlowConsequence}
            className="text-zinc-400 font-semibold hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
