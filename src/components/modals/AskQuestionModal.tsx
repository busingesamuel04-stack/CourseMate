import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, MessageSquare, Send } from 'lucide-react';

export const AskQuestionModal: React.FC = () => {
  const { closeModal, courses, addQuestion, student } = useApp();

  const [courseCode, setCourseCode] = useState(courses[0]?.code || 'HEC1207');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    addQuestion({
      title: title.trim(),
      body: body.trim(),
      courseCode,
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#13141D] border border-white/[0.1] w-full max-w-lg p-6 shadow-2xl space-y-5 rounded-3xl text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Ask a Course Question
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Get answers from classmates, TAs, and peer tutors
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
              Associated Course
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Question Summary
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. When do we rotate right vs flip colors in 2-3 Red-Black trees?"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Details & Context
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Explain where you are stuck, relevant lecture slides or assignment question numbers..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              Posting as <strong className="text-zinc-200">{student.name}</strong>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-full font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Question</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
