import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Play,
  RefreshCw,
  Phone,
  MoreHorizontal,
  Compass,
  FileText,
  Building2,
  School,
} from 'lucide-react';
import { SkeuomorphicDialWidget } from '../common/SkeuomorphicDialWidget';
import { SkeuomorphicPillBar } from '../common/SkeuomorphicPillBar';

export const HomeScreen: React.FC = () => {
  const {
    student,
    events,
    toggleEventCompleted,
    priorities,
    studyRecommendation,
    openModal,
    courses,
    setCurrentTab,
    simulationState,
    setSimulationState,
    logStudyTime,
    selectedUniversity,
  } = useApp();

  // Skeletons for Loading State
  if (simulationState === 'loading') {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto pb-12">
        <div className="h-44 bg-zinc-800/80 rounded-[32px] w-full" />
        <div className="h-32 bg-zinc-800/80 rounded-[28px] w-full" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-800/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-zinc-800/80 rounded-[28px] w-full" />
      </div>
    );
  }

  // Friendly Recovery for Error State
  if (simulationState === 'error') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          We couldn't refresh your timetable
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          Your offline academic cache from 06:15 AM is still available and safe.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setSimulationState('normal')}
            className="skeuo-dark flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => setSimulationState('normal')}
            className="skeuo-raised px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-300"
          >
            Continue Offline
          </button>
        </div>
      </div>
    );
  }

  const todayEvents = events.filter((e) => e.date === '2026-09-29');
  const upcomingExamWithConflict = events.find((e) => e.conflict?.detected);
  const pendingAssignments = events.filter((e) => e.type === 'assignment' && !e.completed);
  const nextClass = todayEvents.find((e) => e.type === 'class');

  const handlePillAction = (actionId: string) => {
    switch (actionId) {
      case 'Timetable':
        setCurrentTab('planner');
        break;
      case 'Registration':
        openModal('ai-assistant');
        break;
      case 'Notes':
        setCurrentTab('courses');
        break;
      case 'Timer':
        setCurrentTab('study');
        break;
      case 'Cards':
        openModal('ai-assistant', { initialTab: 'flashcards' });
        break;
      case 'Portal':
        openModal('source-connect', { initialSource: 'portal' });
        break;
      default:
        break;
    }
  };

  const upcomingCourseCodes = Array.from(
    new Set(priorities.map((p) => p.courseCode).filter(Boolean))
  );
  const nextDueText =
    priorities.length > 0
      ? `Next due: ${priorities[0].title} (${upcomingCourseCodes.slice(0, 2).join(' & ') || courses[0]?.code || 'All Courses'})`
      : courses.length > 0
      ? `All caught up across ${courses.slice(0, 2).map((c) => c.code).join(' & ')}`
      : 'No upcoming deadlines';

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      {/* 1. HERO CANOPY (Dark Canvas with Soft Lavender/Blue Mesh Gradient and iOS Liquid Pill) */}
      <section className="relative w-full gradient-coral-mesh pt-5 sm:pt-7 pb-6 sm:pb-8 px-4 sm:px-8 text-white overflow-hidden rounded-3xl border border-white/[0.08] shadow-xl">
        {/* Subtle decorative ambient curves */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-xs sm:text-sm font-bold text-indigo-300 tracking-wider uppercase">
            Welcome Back
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 mb-5">
            {student?.name || 'Guest Student'}
          </h1>

          {/* iOS Liquid Glass Notification Pill Card with Glossy Sheen */}
          <div
            onClick={() => {
              if (pendingAssignments.length > 0) {
                openModal('assignment-detail', pendingAssignments[0]);
              } else {
                setCurrentTab('planner');
              }
            }}
            className="ios-liquid-pill p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {pendingAssignments.length}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                You have {pendingAssignments.length} {pendingAssignments.length === 1 ? 'assignment' : 'assignments'} in progress
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="space-y-6">

        {/* Guest Mode / Unsynced Portal Prompt Banner */}
        {!student?.isSynced && (
          <div className="ios-liquid-card p-4 sm:p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#13141F] to-violet-950/40 shadow-hi-fi-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="circle-button-skeuo w-11 h-11 bg-indigo-500/20 text-indigo-400 shrink-0 border-indigo-500/30">
                <School className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Portal Not Synced
                  </span>
                  <span className="text-xs text-zinc-400">Guest Mode</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  Connect {student?.university || selectedUniversity || 'University'} Portal to Sync Real Academics
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sync enrolled course units ({courses[0]?.code || 'e.g. HEC1207 / CSC2100'}), timetable, and official fee ledger in one click.
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal('source-connect', { initialSource: 'portal' })}
              className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Connect Portal</span>
            </button>
          </div>
        )}

      {/* 2. DUAL LAYOUT: Upcoming Deadlines Card + Skeuomorphic Rotary Dial Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Elevated Soft Deadlines Card */}
        <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider">
                  Urgent Actions
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1 tracking-tight">
                  {priorities.length} Upcoming Deadlines
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{nextDueText}</span>
                </div>
              </div>

              <div className="circle-button-skeuo text-indigo-400 shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Quick list of urgent deadlines */}
            <div className="space-y-2 mt-4">
              {priorities.length === 0 ? (
                <div className="bg-[#191B29] border border-white/[0.07] p-3.5 rounded-2xl text-center">
                  <p className="text-xs font-bold text-zinc-300">
                    No urgent deadlines pending
                  </p>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    All course deliverables and units up to date
                  </span>
                </div>
              ) : (
                priorities.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const matched = events.find((e) => e.title.includes(item.title) || item.title.includes(e.title));
                      if (matched) openModal('assignment-detail', matched);
                    }}
                    className="bg-[#191B29] hover:bg-[#202334] border border-white/[0.07] p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm gap-2"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-white truncate line-clamp-1">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-medium truncate block">
                        {item.courseCode} · Due {item.dueTime}
                      </span>
                    </div>
                    <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold py-0.5 px-2 rounded-full shrink-0">
                      High Yield
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-zinc-400">
              Auto-monitored from LMS
            </span>
            <button
              onClick={() => setCurrentTab('planner')}
              className="bg-white hover:bg-zinc-100 text-black px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95"
            >
              View All in Planner
            </button>
          </div>
        </section>

        {/* Right: Rotary Dial Focus Gauge */}
        <SkeuomorphicDialWidget
          currentValue={student?.weeklyStudyHoursLogged || 0}
          maxValue={student?.weeklyStudyHoursGoal || 20}
          unit="h"
          title="Weekly Study Target"
          subtitle="Rotary focus gauge with smooth progression"
          onValueChange={(val) => {
            logStudyTime(val - (student?.weeklyStudyHoursLogged || 0));
          }}
        />
      </div>

      {/* Conflict Alert Banner if any discrepancies detected */}
      {upcomingExamWithConflict && (
        <div
          onClick={() => openModal('exam-conflict', upcomingExamWithConflict)}
          className="ios-liquid-card p-4.5 border border-amber-500/30 bg-[#1D1914] hover:bg-[#231E18] cursor-pointer transition-colors shadow-sm flex items-start gap-3.5"
        >
          <div className="circle-button-skeuo w-10 h-10 bg-amber-500/15 text-amber-400 shrink-0 border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-200">
                Exam Schedule Conflict Detected
              </h3>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] py-0.5 px-2.5 font-bold rounded-full shrink-0">
                Review &rarr;
              </span>
            </div>
            <p className="text-xs text-amber-300/80 mt-1 leading-relaxed font-medium">
              {upcomingExamWithConflict?.courseCode || courses[0]?.code || 'Course'} exam date differs between official {student?.university || 'University'} portal and student WhatsApp rep. Tap to review provenance.
            </p>
          </div>
        </div>
      )}

      {/* 3. QUICK ACTIONS & TACTILE CONTROLS */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md">
        <SkeuomorphicPillBar onSelectAction={handlePillAction} />
      </section>

      {/* 4. TODAY'S MAIN CLASS CARD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Today's Classes & Labs
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Real-time room routing & lecturer contact
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('planner')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View Full Timetable
          </button>
        </div>

        {nextClass ? (
          <div className="ios-liquid-card overflow-hidden card-soft-hover shadow-hi-fi-md">
            {/* Architectural Banner Header with subtle dark gradient overlay */}
            <div className="h-44 w-full relative bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 flex items-center justify-center overflow-hidden liquid-sheen border-b border-white/[0.08]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#12131D] via-transparent to-transparent z-10" />
              <Building2 className="w-20 h-20 text-white/20" />

              {/* Tag embedded in bottom left of banner */}
              <div className="absolute bottom-3.5 left-4 z-20">
                <span className="ios-liquid-pill text-indigo-300 font-extrabold text-xs py-1 px-3 shadow-sm border border-indigo-500/30 bg-[#161826]/90">
                  {nextClass.courseCode} · Core Lecture
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {nextClass.title}
                </h3>
                <div className="space-y-1.5 mt-2.5 text-xs text-zinc-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{nextClass.location} (2.3km) · Main Campus</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{nextClass.startTime} · Class runs until {nextClass.endTime}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    const course = courses.find((c) => c.code === nextClass.courseCode);
                    if (course) openModal('course-detail', course);
                  }}
                  className="bg-white hover:bg-zinc-100 text-black flex-1 py-3 text-xs flex items-center justify-center gap-1.5 rounded-full font-bold shadow-md transition-all"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Direction / Room Info</span>
                </button>

                <button
                  onClick={() => {
                    if (courses && courses.length > 0) openModal('course-detail', courses[0]);
                  }}
                  className="circle-button-skeuo shadow-sm"
                  title="Contact Department / Lecturer"
                >
                  <Phone className="w-4 h-4 text-zinc-300" />
                </button>

                <button
                  onClick={() => toggleEventCompleted(nextClass.id)}
                  className="circle-button-skeuo shadow-sm"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4 text-zinc-300" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="ios-liquid-card p-8 text-center shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">
              No more lectures scheduled today
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              You are free to focus on assignments or study review.
            </p>
          </div>
        )}
      </section>

      {/* 5. TWO COLUMNS: e-Cards (Digital Student Card) & Latest Advising */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* e-Card Student Identity Card with iOS Dark Metallic Surface */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-white tracking-tight">
            e-Cards
          </h2>

          <div className="h-48 w-full rounded-[32px] bg-gradient-to-br from-[#1E2034] via-[#161726] to-[#12131F] p-5 text-white flex flex-col justify-between shadow-xl relative overflow-hidden liquid-sheen border border-white/[0.1]">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Watermark card number */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Student ID Card
              </span>
              <span className="font-mono text-xs font-bold tracking-widest text-zinc-300">
                {student.studentId}
              </span>
            </div>

            {/* Bottom student detail */}
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-13 h-13 rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white leading-tight">
                  {student.name}
                </h4>
                <p className="text-xs text-zinc-300 font-medium mt-0.5">
                  {student.programme}
                </p>
                <span className="text-[10px] text-zinc-400 font-semibold">
                  Year {student.year} · Sem {student.semester}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Faculty Advising Card */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-white tracking-tight">
            Latest Academic Advising
          </h2>

          <div className="ios-liquid-card p-5 space-y-4 card-soft-hover shadow-hi-fi-md flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-base shrink-0 shadow-sm">
                SN
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">
                  Dr. Sarah Nabirye
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold py-0.5 px-2 rounded-full shrink-0">
                    Office Hours
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Fri, 02 Oct | 10:00 AM
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/[0.08] text-xs text-zinc-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {courses[0]?.code
                    ? `${courses[0].code} Assessment Schedule Verified`
                    : 'Assessment Schedule Verified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {courses[1]?.code
                    ? `${courses[1].code} Revision Materials Active`
                    : 'Active Recall Problem Set Released'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHAT SHOULD YOU STUDY NOW? (Study Companion Card) */}
      <section className="ios-liquid-card p-5 sm:p-6 space-y-4 card-soft-hover shadow-hi-fi-md">
        <div className="flex items-center justify-between">
          <span className="pill-tag-coral text-xs font-bold py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400 fill-indigo-400/30" />
            Smart Study Recommendation
          </span>
          <span className="text-xs font-bold text-zinc-400">
            {studyRecommendation.availableMinutes} min free slot
          </span>
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">
            {studyRecommendation.courseCode}: {studyRecommendation.topic}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed font-normal">
            {studyRecommendation.reason}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => openModal('focus-session', studyRecommendation)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white w-full sm:w-auto px-7 py-3 rounded-full text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Study Session</span>
          </button>

          <button
            onClick={() =>
              openModal('ai-assistant', {
                initialTab: 'coach',
                courseCode: studyRecommendation.courseCode,
                topic: studyRecommendation.topic,
              })
            }
            className="bg-[#1E202E] hover:bg-[#26293B] border border-white/[0.08] w-full sm:w-auto py-3 px-5 rounded-full text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            Ask AI Coach
          </button>
        </div>
      </section>
      </div>
    </div>
  );
};
