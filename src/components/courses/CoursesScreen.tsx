import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  MapPin,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Course } from '../../types';

export const CoursesScreen: React.FC = () => {
  const { courses, setSelectedCourse, openModal, student } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(
    (c) =>
      (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lecturer || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    openModal('course-detail', course);
  };

  const totalCredits =
    student?.creditsCurrentSemester ||
    courses.reduce((acc, c) => acc + (c.credits || c.creditUnits || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Enrolled Courses
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-medium">
            {courses.length} enrolled courses · {totalCredits} Credit Units · {student?.semesterName || `Semester ${student?.semester || 1}`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search course or lecturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-xs bg-[#13141F] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleOpenCourse(course)}
            className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md hover:shadow-hi-fi-lg cursor-pointer transition-all flex flex-col justify-between group liquid-sheen select-none"
          >
            <div>
              {/* Top row: Code, CU, Grade estimate */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="pill-tag-coral text-xs font-bold py-1 px-3">
                    {course.code}
                  </span>
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    {course.credits} CU
                  </span>
                </div>
                <span className="bg-[#1C1E2D] border border-white/[0.08] text-xs font-extrabold text-zinc-200 px-3 py-1 rounded-full shadow-xs">
                  {course.gradeEstimate}
                </span>
              </div>

              {/* Title & Lecturer */}
              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                {course.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {course.lecturer}
              </p>

              {/* Next Class & Location */}
              <div className="mt-3.5 flex items-center gap-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{course.nextClass}</span>
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{course.room}</span>
                </span>
              </div>
            </div>

            {/* Bottom Row: Study Progress & Counts */}
            <div className="mt-5 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-semibold">
                <span>Study Progress</span>
                <span className="font-extrabold text-white tabular-nums">
                  {course.progressPct}%
                </span>
              </div>

              {/* Progress Bar with Soft Lavender/Blue Gradient */}
              <div className="h-2 w-full rounded-full bg-[#181926] p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all duration-500"
                  style={{
                    width: `${course.progressPct}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-3.5 text-xs text-zinc-400 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[11px] font-medium flex-wrap">
                  <span>{course.upcomingAssignments} assignments</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{course.upcomingTests} tests</span>
                </div>
                <span className="text-indigo-400 group-hover:text-indigo-300 font-extrabold group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 shrink-0">
                  Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
