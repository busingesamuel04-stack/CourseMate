import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Play,
  Sparkles,
} from 'lucide-react';
import { Course } from '../../types';

export const CourseDetailModal: React.FC = () => {
  const { modalData, closeModal, events, studyMaterials, openModal, courses } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'assessments' | 'syllabus'>('overview');

  // Grab the live updated course from courses array
  const course: Course | undefined = courses.find(
    (c) => c.id === modalData?.id || c.code === modalData?.code
  ) || modalData;

  if (!course) return null;

  const courseEvents = events.filter((e) => e.courseCode === course.code);
  const courseMaterials = studyMaterials.filter((m) => m.courseCode === course.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs"
              style={{ backgroundColor: course.color }}
            />
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full">
              {course.code} · {course.credits} Credit Units
            </span>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Lecturer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {course.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Lecturer: {course.lecturer} · {course.room}
            </p>
          </div>

          <button
            onClick={() => {
              closeModal();
              openModal('focus-session', {
                courseCode: course.code,
                topic: `${course.name} Core Review`,
                availableMinutes: 30,
              });
            }}
            className="bg-white hover:bg-zinc-100 text-black flex items-center gap-2 px-6 py-3 text-xs rounded-full font-bold shadow-md shrink-0 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Launch Study Session</span>
          </button>
        </div>

        {/* Quick Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Next Class
            </span>
            <p className="text-xs font-bold text-white mt-1 truncate">
              {course.nextClass}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Study Progress
            </span>
            <p className="text-xs font-bold text-indigo-400 mt-1 tabular-nums">
              {course.progressPct}%
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Estimated Grade
            </span>
            <p className="text-xs font-bold text-white mt-1">
              {course.gradeEstimate}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Pending Tasks
            </span>
            <p className="text-xs font-bold text-white mt-1">
              {course.upcomingAssignments} due
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#090A0E] border border-white/[0.06] text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview & Room' },
            { id: 'materials', label: `Materials (${courseMaterials.length})` },
            { id: 'assessments', label: `Assessments (${courseEvents.length})` },
            { id: 'syllabus', label: 'Syllabus Breakdown' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
                Course Description & Objectives
              </h3>
              <p className="text-zinc-300 leading-relaxed font-normal">
                {(course as any).description || `Comprehensive study of ${course.name} encompassing theoretical foundations, algorithmic analysis, and practical implementations.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Lecturer Information
                </span>
                <p className="text-sm font-bold text-white mt-1">
                  {course.lecturer}
                </p>
                <p className="text-zinc-400 mt-0.5 font-medium">
                  {(course as any).lecturerEmail || `${course.lecturer.toLowerCase().replace(/[^a-z]/g, '')}@university.ac.ug`}
                </p>
                <div className="mt-3 pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Office Hours: Mondays & Thursdays 2-4 PM
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Venue & Schedule
                </span>
                <p className="text-sm font-bold text-white mt-1">
                  {course.room}
                </p>
                <p className="text-zinc-400 mt-0.5 font-medium">
                  {(course as any).scheduleText || `Next session scheduled: ${course.nextClass}`}
                </p>
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-400">
                    Class Rep: Brian O.
                  </span>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal('ai-assistant', {
                        initialTab: 'explain',
                        courseCode: course.code,
                      });
                    }}
                    className="text-indigo-400 font-bold hover:underline"
                  >
                    AI Tutor &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Materials */}
        {activeTab === 'materials' && (
          <div className="space-y-3 text-xs">
            {courseMaterials.length === 0 ? (
              <p className="p-6 text-center text-zinc-500">
                No course slides or past papers uploaded yet for this course.
              </p>
            ) : (
              courseMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => {
                    closeModal();
                    openModal('material-viewer', mat);
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-white/[0.12] transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                        {mat.type.replace('_', ' ')}
                      </span>
                      <span className="text-zinc-400 font-medium">{mat.fileSize}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{mat.title}</h4>
                    <p className="text-zinc-400 mt-0.5 font-normal">{mat.summary}</p>
                  </div>
                  <span className="text-indigo-400 font-bold shrink-0">Open &rarr;</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Assessments */}
        {activeTab === 'assessments' && (
          <div className="space-y-3 text-xs">
            {courseEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                      {evt.type.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-400 font-medium">Due: {evt.date} · {evt.endTime}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{evt.title}</h4>
                  <p className="text-zinc-400 mt-0.5 font-normal">Venue: {evt.location}</p>
                </div>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                    evt.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {evt.completed ? 'Finished ✓' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Syllabus Breakdown */}
        {activeTab === 'syllabus' && (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">
                  Semester 1 Syllabus Modules
                </h4>
                <button
                  onClick={() => {
                    closeModal();
                    openModal('ai-assistant', {
                      initialTab: 'coach',
                      courseCode: course.code,
                      topic: 'Syllabus Mastery Drill',
                    });
                  }}
                  className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 fill-indigo-400" />
                  <span>AI Study Plan</span>
                </button>
              </div>

              <div className="space-y-2 text-zinc-300">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="font-bold text-indigo-400">W1-W3</span>
                  <div>
                    <p className="font-bold text-white">Foundational Principles & Asymptotic Analysis</p>
                    <p className="text-[11px] text-zinc-400 font-medium">Completed · Mastered in Active Recall</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="font-bold text-indigo-400">W4-W7</span>
                  <div>
                    <p className="font-bold text-white">Self-Balancing Trees, Heaps & Priority Queues</p>
                    <p className="text-[11px] text-indigo-300 font-medium">Current Module · Midterm Focus</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="font-bold text-zinc-500">W8-W12</span>
                  <div>
                    <p className="font-bold text-white">Dynamic Programming & Network Flow</p>
                    <p className="text-[11px] text-zinc-500 font-medium">Upcoming Second Half</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
