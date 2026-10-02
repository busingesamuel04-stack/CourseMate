import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar } from 'lucide-react';
import { EventType } from '../../types';

export const AddEventModal: React.FC = () => {
  const { courses, addEvent, closeModal } = useApp();

  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code || 'HEC1207');
  const [eventType, setEventType] = useState<EventType>('class');
  const [date, setDate] = useState('2026-09-30');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('Main Campus · Room 302');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedCourse = courses.find((c) => c.code === courseCode);

    addEvent({
      title,
      courseCode,
      courseName: matchedCourse?.name || courseCode,
      type: eventType,
      date,
      startTime,
      endTime,
      location,
      notes,
      source: {
        type: 'personal',
        label: 'Student Added Event',
        verified: true,
      },
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-white modal-sheet-dynamic overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-bold text-white">
              Add Calendar Event
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Lectures, tutorial sessions, exams, or group study meetings
            </p>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Extra Practical Session or Tutorial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Course
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.name.slice(0, 20)}...
                    </option>
                  ))
                ) : (
                  <option value="HEC1207">HEC1207</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="class">Lecture Class</option>
                <option value="test">Test / Quiz</option>
                <option value="exam">Official Exam</option>
                <option value="study_session">Group Study Session</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
              Venue / Room Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Block Room 104"
              className="w-full px-4 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
              className="bg-white hover:bg-zinc-100 text-black flex items-center gap-1.5 px-6 py-2.5 text-xs rounded-full font-bold shadow-md transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
