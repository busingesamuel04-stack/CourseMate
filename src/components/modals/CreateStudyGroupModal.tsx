import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Users, MapPin, Clock, Sparkles } from 'lucide-react';
import { SupportedUniversity } from '../../types';
import { getUniversityCampusVenues } from '../../data/mockData';

export const CreateStudyGroupModal: React.FC = () => {
  const { closeModal, courses, addStudyGroup, student, selectedUniversity } = useApp();
  const activeUni: SupportedUniversity =
    selectedUniversity || (student.university as SupportedUniversity) || 'ISBAT University';
  const defaultVenues = getUniversityCampusVenues(activeUni);

  const [courseCode, setCourseCode] = useState(
    courses[0]?.code || (activeUni === 'Makerere University' ? 'CSC2100' : 'HEC1207')
  );
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [schedule, setSchedule] = useState('Thursdays · 16:00 - 18:00');
  const [location, setLocation] = useState(defaultVenues[0] || 'Main Campus Study Pod');
  const [maxMembers, setMaxMembers] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;

    addStudyGroup({
      university: activeUni,
      courseCode,
      name: name.trim(),
      topic: topic.trim(),
      schedule,
      location,
      maxMembers,
      adminName: student.name,
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#13141D] border border-white/[0.1] w-full max-w-lg p-6 shadow-2xl space-y-5 rounded-3xl text-white modal-sheet-dynamic overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Create a Study Group
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Assemble a peer learning cohort for your course
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Course
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {courses.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setCourseCode(c.code)}
                  className={`p-2.5 rounded-2xl font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    courseCode === c.code
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                      : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="text-xs">{c.code}</span>
                  <span className="text-[10px] opacity-75 truncate max-w-[80px]">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${courseCode || courses[0]?.code || 'HEC1207'} Study Cohort`}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Focus Topic / Syllabus Milestone
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Coursework Review & Exam Problem Sets"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Schedule Time
              </label>
              <input
                type="text"
                required
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Fridays · 14:00 - 16:00"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Library Level 2 Carrels"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 mb-1.5">
              <span className="uppercase tracking-wider">Cohort Capacity</span>
              <span className="text-indigo-400 font-bold">{maxMembers} peers max</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Launch Study Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
