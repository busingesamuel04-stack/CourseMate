import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  CheckCircle2,
  Circle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { CalendarViewType } from '../../types';

export const PlannerScreen: React.FC = () => {
  const {
    events,
    toggleEventCompleted,
    openModal,
    courses,
  } = useApp();

  const [viewType, setViewType] = useState<CalendarViewType>('agenda');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-29');

  const daysOfWeek = [
    { label: 'Mon', day: '28', fullDate: '2026-09-28' },
    { label: 'Tue', day: '29', fullDate: '2026-09-29' },
    { label: 'Wed', day: '30', fullDate: '2026-09-30' },
    { label: 'Thu', day: '01', fullDate: '2026-10-01' },
    { label: 'Fri', day: '02', fullDate: '2026-10-02' },
    { label: 'Sat', day: '03', fullDate: '2026-10-03' },
    { label: 'Sun', day: '04', fullDate: '2026-10-04' },
  ];

  const filteredEvents = events.filter((evt) => {
    // Filter by type
    if (selectedFilter === 'classes' && evt.type !== 'class') return false;
    if (selectedFilter === 'assignments' && evt.type !== 'assignment') return false;
    if (selectedFilter === 'exams' && evt.type !== 'test' && evt.type !== 'exam') return false;
    if (selectedFilter === 'study' && evt.type !== 'study_session') return false;

    // Filter by date if in Day view
    if (viewType === 'day' && evt.date !== selectedDate) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header & Tactile Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Academic Planner
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-medium">
            Timetable, deadlines, exams, and verified study commitments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openModal('add-task')}
            className="bg-white hover:bg-zinc-100 text-black flex items-center gap-1.5 px-4.5 py-2.5 text-xs rounded-full font-bold shadow-md transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => openModal('add-event')}
            className="bg-[#1C1E2D] hover:bg-[#25283B] border border-white/[0.08] flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-zinc-200 hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Week Day Picker Carousel with iOS Liquid Glass & Tactile Buttons */}
      <div className="ios-liquid-card p-4 sm:p-5 card-soft-hover liquid-sheen shadow-hi-fi-md">
        <div className="flex items-center justify-between mb-3 px-1 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider">
              Semester 1 · Week 7
            </span>
            <span className="text-zinc-400 text-xs">September / October 2026</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="circle-button-skeuo w-7 h-7 shadow-sm"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              className="circle-button-skeuo w-7 h-7 shadow-sm"
              aria-label="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {daysOfWeek.map(({ label, day, fullDate }) => {
            const isSelected = selectedDate === fullDate;
            const hasEvents = events.some((e) => e.date === fullDate);
            return (
              <button
                key={fullDate}
                onClick={() => {
                  setSelectedDate(fullDate);
                  if (viewType === 'agenda') setViewType('day');
                }}
                className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 font-extrabold text-white shadow-lg shadow-indigo-500/30 scale-102 border border-white/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.07] text-zinc-400 hover:text-white shadow-xs'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-white/90' : 'text-zinc-400'}`}>
                  {label}
                </span>
                <span className={`text-sm sm:text-base font-extrabold mt-0.5 tabular-nums ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                  {day}
                </span>
                {hasEvents && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      isSelected ? 'bg-white' : 'bg-indigo-400 shadow-[0_0_4px_#818CF8]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Mode Buttons (Segmented pill) */}
        <div className="flex items-center bg-[#13141F] border border-white/[0.08] p-1 rounded-full self-start shadow-inner">
          {(['agenda', 'day', 'week', 'month'] as CalendarViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={`px-3.5 py-1 text-xs font-bold rounded-full capitalize transition-all ${
                viewType === v
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'classes', label: 'Classes' },
            { id: 'assignments', label: 'Assignments' },
            { id: 'exams', label: 'Exams & Tests' },
            { id: 'study', label: 'Study' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelectedFilter(id)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedFilter === id
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List / Timeline Display */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="ios-liquid-card p-10 text-center shadow-sm">
            <CalendarIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">
              No events match this filter
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select another day or adjust your filter.
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isCompleted = evt.completed;
            const isAssignment = evt.type === 'assignment';
            const isExam = evt.type === 'test' || evt.type === 'exam';

            return (
              <div
                key={evt.id}
                className={`ios-liquid-card p-4 sm:p-5 card-soft-hover shadow-hi-fi-sm relative flex items-start sm:items-center justify-between gap-3.5 transition-all ${
                  isCompleted ? 'opacity-50' : ''
                }`}
              >
                {/* Time & Date Column */}
                <div className="flex flex-col items-center justify-center w-16 sm:w-20 shrink-0 border-r border-white/[0.08] pr-2">
                  <span className="text-xs font-bold text-white tabular-nums">
                    {evt.startTime}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {evt.date === '2026-09-29' ? 'Today' : evt.date.slice(5)}
                  </span>
                </div>

                {/* Event Body */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (isExam && evt.conflict?.detected) {
                      openModal('exam-conflict', evt);
                    } else if (isAssignment) {
                      openModal('assignment-detail', evt);
                    } else {
                      const matched = courses.find((c) => c.code === evt.courseCode);
                      if (matched) openModal('course-detail', matched);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="pill-tag-coral text-[10px] py-0.5 px-2 font-bold">
                      {evt.courseCode}
                    </span>
                    <span className="text-zinc-600" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 capitalize">
                      {evt.type.replace('_', ' ')}
                    </span>
                    {evt.conflict?.detected && (
                      <>
                        <span className="text-zinc-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Conflict Detected
                        </span>
                      </>
                    )}
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-extrabold truncate ${
                      isCompleted
                        ? 'line-through text-zinc-500'
                        : 'text-white'
                    }`}
                  >
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{evt.source.label}</span>
                    </span>
                  </div>
                </div>

                {/* Completion Toggle */}
                <button
                  onClick={() => toggleEventCompleted(evt.id)}
                  className="circle-button-skeuo w-10 h-10 shrink-0"
                  title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  aria-label={isCompleted ? 'Mark event incomplete' : 'Mark event complete'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-400 hover:text-indigo-400" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
