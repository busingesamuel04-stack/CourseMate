import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Calendar,
  BookOpen,
  Flame,
  Users,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { TabType, Course } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    student,
    courses,
    setSelectedCourse,
    openModal,
  } = useApp();

  const mainItems: { label: string; tab: TabType; icon: React.FC<{ className?: string }> }[] = [
    { label: 'Home', tab: 'home', icon: Home },
    { label: 'Planner', tab: 'planner', icon: Calendar },
    { label: 'Courses', tab: 'courses', icon: BookOpen },
    { label: 'Study Engine', tab: 'study', icon: Flame },
    { label: 'Campus Hub', tab: 'campus', icon: Users },
    { label: 'Profile & Sync', tab: 'profile', icon: User },
  ];

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    openModal('course-detail', course);
  };

  const logged = student?.weeklyStudyHoursLogged || 0;
  const goal = student?.weeklyStudyHoursGoal || 20;
  const progressPercent = Math.round((logged / goal) * 100);

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 flex-col justify-between border-r border-white/[0.07] bg-[#0A0B0E] p-4 overflow-y-auto z-20">
      <div className="space-y-6">
        {/* Student Mini Card (Dark Rounded Card) */}
        <div className="bg-[#141522] border border-white/[0.08] rounded-[26px] p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-sm shadow-md shadow-indigo-500/20">
              {(student?.name || 'Guest')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('') || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {student?.preferredName || student?.name || 'Guest Student'}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate font-medium">
                Year {student?.year || 1} · Sem {student?.semester || 1}
              </p>
            </div>
            <div
              className="bg-[#1D1F2E] border border-white/[0.08] px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold text-indigo-300 shrink-0"
              title={`${student?.studyStreakDays || 1} Day Streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
              <span>{student?.studyStreakDays || 1}d</span>
            </div>
          </div>

          {/* Weekly Study Progress Meter */}
          <div className="mt-3.5 pt-3 border-t border-white/[0.07]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-zinc-400 font-semibold">
                Weekly Target
              </span>
              <span className="font-extrabold text-white tabular-nums">
                {logged}h / {goal}h
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#181A27] p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
            Workspace
          </p>
          {mainItems.map(({ label, tab, icon: Icon }) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Enrolled Courses Shortcuts */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
              Courses ({courses.length})
            </p>
            <button
              onClick={() => setCurrentTab('courses')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-1">
            {courses.slice(0, 4).map((course) => (
              <button
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-all text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="font-bold text-white truncate">
                    {course.code}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {course.name}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums font-bold text-zinc-400 group-hover:text-white">
                  {course.progressPct}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Quick Action + Synced Sources Notice */}
      <div className="pt-4 border-t border-white/[0.07] space-y-3">
        <button
          onClick={() => openModal('add-task')}
          className="bg-white hover:bg-zinc-100 text-black flex w-full items-center justify-center gap-2 py-3 px-3 rounded-full text-xs font-extrabold shadow-md transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Add Academic Item</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
            <span>Portal & LMS Synced</span>
          </div>
          <button
            onClick={() => openModal('source-connect')}
            className="hover:text-white transition-colors"
            title="Manage Connected Sources"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
