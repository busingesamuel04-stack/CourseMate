import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Flame,
  Search,
  Plus,
  Check,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';

interface StudyGroupsPageProps {
  onBack: () => void;
}

export const StudyGroupsPage: React.FC<StudyGroupsPageProps> = () => {
  const { studyGroups, toggleJoinStudyGroup, addStudySessionToPlanner, openModal, courses, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');

  const scopedGroups = useMemo(() => {
    return studyGroups.filter((g) => !g.university || g.university === activeUni);
  }, [studyGroups, activeUni]);

  const courseCodes = useMemo(() => {
    const codes = courses.map((c) => c.code);
    scopedGroups.forEach((g) => {
      if (g.courseCode && !codes.includes(g.courseCode)) {
        codes.push(g.courseCode);
      }
    });
    return ['All', ...Array.from(new Set(codes))];
  }, [courses, scopedGroups]);

  const filtered = useMemo(() => {
    return scopedGroups.filter((g) => {
      const matchesCourse = selectedCourse === 'All' || g.courseCode === selectedCourse;
      const matchesSearch =
        !search.trim() ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.courseCode.toLowerCase().includes(search.toLowerCase()) ||
        g.topic.toLowerCase().includes(search.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  }, [scopedGroups, selectedCourse, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Academic Cohorts
              </span>
              <span>·</span>
              <span>{scopedGroups.length} Active Cohorts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Study Groups & Cohorts
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Form small, focused peer cohorts to solve past papers, prepare for midterms, and sync scheduled sessions directly to your CourseMate Planner.
            </p>
          </div>

          <button
            onClick={() => openModal('create-study-group')}
            className="bg-white hover:bg-zinc-100 text-black font-extrabold px-5 py-2.5 rounded-full text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Group</span>
          </button>
        </div>
      </div>

      {/* Search & Course Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, course, or study group title..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Course Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {courseCodes.map((code) => (
              <button
                key={code}
                onClick={() => setSelectedCourse(code)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCourse === code
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Tile Grid */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <Flame className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No study groups found</h3>
          <p className="text-xs text-zinc-400">
            No study groups matched your filter. Would you like to create one for your course?
          </p>
          <button
            onClick={() => openModal('create-study-group')}
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all"
          >
            Create {selectedCourse !== 'All' ? selectedCourse : ''} Study Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((grp) => (
            <div
              key={grp.id}
              className="ios-liquid-card p-5 card-soft-hover shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-bold uppercase">
                    {grp.courseCode}
                  </span>
                  <span className="font-bold text-zinc-400 bg-[#1A1C2B] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                    {grp.membersCount} / {grp.maxMembers} peers enrolled
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white leading-snug">
                  {grp.name}
                </h3>

                <p className="text-xs text-zinc-300 font-medium">
                  Focus: <strong className="text-white">{grp.topic}</strong>
                </p>

                <div className="pt-1.5 space-y-1.5 text-xs text-zinc-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="font-semibold text-zinc-200">{grp.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{grp.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400 truncate">
                  Admin: <strong className="text-zinc-200">{grp.adminName}</strong>
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => addStudySessionToPlanner(grp)}
                    className="bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-300 hover:text-white shadow-xs flex items-center gap-1 transition-all"
                    title="Sync study session to Planner"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sync Planner</span>
                  </button>

                  <button
                    onClick={() => toggleJoinStudyGroup(grp.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                      grp.isMember
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold'
                        : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    }`}
                  >
                    {grp.isMember ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Enrolled</span>
                      </>
                    ) : (
                      <span>Join Group</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
