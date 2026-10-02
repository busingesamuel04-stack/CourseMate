import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Calendar,
  Flame,
  Users,
  User,
  FileCheck,
  Timer,
  X,
  Sparkles,
} from 'lucide-react';
import { TabType } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openModal } = useApp();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const tabs: { label: string; tab: TabType; icon: React.FC<{ className?: string }> }[] = [
    { label: 'Home', tab: 'home', icon: Home },
    { label: 'Planner', tab: 'planner', icon: Calendar },
    { label: 'Study', tab: 'study', icon: Flame },
    { label: 'Campus', tab: 'campus', icon: Users },
    { label: 'Profile', tab: 'profile', icon: User },
  ];

  return (
    <>
      {/* Quick Action Speed Dial Drawer Backdrop */}
      {quickMenuOpen && (
        <div
          onClick={() => setQuickMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        />
      )}

      {/* Floating Action Menu popup above bottom bar */}
      {quickMenuOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-[#161825] border border-white/[0.08] rounded-[32px] p-4.5 shadow-2xl animate-in zoom-in-95 duration-150 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Quick Academic Action
            </span>
            <button
              onClick={() => setQuickMenuOpen(false)}
              className="w-7 h-7 rounded-full bg-[#222538] text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setQuickMenuOpen(false);
                openModal('add-task');
              }}
              className="bg-[#1C1F30] hover:bg-[#25283E] border border-white/[0.07] p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Add Task
                </p>
                <p className="text-[10px] text-zinc-400">Assignment / To-do</p>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                openModal('add-event');
              }}
              className="bg-[#1C1F30] hover:bg-[#25283E] border border-white/[0.07] p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-[#25283C] border border-white/[0.08] flex items-center justify-center text-white shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Add Event
                </p>
                <p className="text-[10px] text-zinc-400">Class or exam</p>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                openModal('focus-session');
              }}
              className="bg-[#1C1F30] hover:bg-[#25283E] border border-white/[0.07] p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-[#25283C] border border-white/[0.08] flex items-center justify-center text-white shadow-xs">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Study Session
                </p>
                <p className="text-[10px] text-zinc-400">Focus & recall</p>
              </div>
            </button>

            <button
              onClick={() => {
                setQuickMenuOpen(false);
                openModal('ai-assistant');
              }}
              className="bg-[#1C1F30] hover:bg-[#25283E] border border-white/[0.07] p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  AI Tutor
                </p>
                <p className="text-[10px] text-zinc-400">Explain or drill</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Dark Dock Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-4">
        <nav
          aria-label="Mobile Navigation"
          className="bg-[#141522]/90 backdrop-blur-2xl border border-white/[0.09] shadow-2xl max-w-[340px] mx-auto h-16 rounded-[36px] px-2.5 flex items-center justify-around pointer-events-auto"
        >
          {tabs.map(({ label, tab, icon: Icon }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setQuickMenuOpen(false);
                  setCurrentTab(tab);
                }}
                className="relative flex items-center justify-center p-1 transition-all group focus:outline-none"
                title={label}
                aria-label={label}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black shadow-lg scale-105 font-extrabold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
