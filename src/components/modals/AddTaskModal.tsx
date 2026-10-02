import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus } from 'lucide-react';
import { EventType } from '../../types';

export const AddTaskModal: React.FC = () => {
  const { courses, addEvent, closeModal, modalData } = useApp();

  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(modalData?.defaultCourseCode || courses[0]?.code || 'GENERAL');
  const [taskType, setTaskType] = useState<EventType>('assignment');
  const [date, setDate] = useState('2026-09-30');
  const [time, setTime] = useState('23:59');
  const [location, setLocation] = useState('LMS Portal Submission');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedCourse = courses.find((c) => c.code === courseCode);

    addEvent({
      title,
      courseCode,
      courseName: matchedCourse?.name || courseCode,
      type: taskType,
      date,
      startTime: time,
      endTime: time,
      location,
      notes,
      source: {
        type: 'personal',
        label: 'Student Created Task',
        verified: true,
      },
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#161826] border border-white/[0.1] rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-white modal-sheet-dynamic overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-extrabold text-white">
              Add Academic Task / Deadline
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Instantly syncs with Home, Planner & AI study recommendations
            </p>
          </div>
          <button
            onClick={closeModal}
            className="circle-button-skeuo w-9 h-9"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
              Task Title / Assignment Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Coursework Assignment or Lab Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[#12131F] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
                Course
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-full bg-[#12131F] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.code} - {c.name.length > 22 ? `${c.name.slice(0, 22)}...` : c.name}
                    </option>
                  ))
                ) : (
                  <option value="GENERAL">General Academic Task</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
                Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as EventType)}
                className="w-full px-3 py-2.5 rounded-full bg-[#12131F] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="assignment">Assignment</option>
                <option value="test">Test / Quiz</option>
                <option value="exam">Exam</option>
                <option value="study_session">Study Session</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-[#12131F] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
                Submission Cutoff Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-[#12131F] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
              Submission Venue / Portal
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Moodle Portal, Room 204"
              className="w-full px-4 py-2.5 rounded-full bg-[#12131F] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-zinc-300 mb-1">
              Notes & Guidelines (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Upload PDF report max 5MB"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#12131F] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-white hover:bg-zinc-100 text-black flex items-center gap-1.5 px-6 py-2.5 text-xs rounded-full font-extrabold shadow-md active:scale-98 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
