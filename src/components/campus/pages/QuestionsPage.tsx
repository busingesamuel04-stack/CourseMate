import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Search,
  Plus,
  ThumbsUp,
  Check,
  HelpCircle,
} from 'lucide-react';

interface QuestionsPageProps {
  onBack: () => void;
}

export const QuestionsPage: React.FC<QuestionsPageProps> = () => {
  const { campusQuestions, toggleUpvoteQuestion, openModal, courses: appCourses, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');

  const scopedQuestions = useMemo(() => {
    return campusQuestions.filter((q) => !q.university || q.university === activeUni);
  }, [campusQuestions, activeUni]);

  const courses = useMemo(() => {
    const codes = appCourses.map((c) => c.code);
    scopedQuestions.forEach((q) => {
      if (q.courseCode && !codes.includes(q.courseCode)) {
        codes.push(q.courseCode);
      }
    });
    return ['All', ...Array.from(new Set(codes))];
  }, [appCourses, scopedQuestions]);

  const filtered = useMemo(() => {
    return scopedQuestions.filter((q) => {
      const matchesCourse = selectedCourse === 'All' || q.courseCode === selectedCourse;
      const matchesSearch =
        !search.trim() ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.body.toLowerCase().includes(search.toLowerCase()) ||
        q.courseCode.toLowerCase().includes(search.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  }, [scopedQuestions, selectedCourse, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#075985] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Engagement Forum
              </span>
              <span>·</span>
              <span>{scopedQuestions.length} Questions Answered</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Course Questions & Q&A
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Clarify past papers, algorithm problem sets, lab setup errors, and exam rubric nuances. Verified answers endorsed by lecturers and class reps.
            </p>
          </div>

          <button
            onClick={() => openModal('ask-question')}
            className="bg-white hover:bg-zinc-100 text-black font-extrabold px-5 py-2.5 rounded-full text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ask a Question</span>
          </button>
        </div>
      </div>

      {/* Search & Course Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions by topic, algorithm, or course..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {courses.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCourse(c)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCourse === c
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Stack */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <HelpCircle className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No questions found</h3>
          <p className="text-xs text-zinc-400">
            Be the first to post a question for your classmates and lecturers to answer.
          </p>
          <button
            onClick={() => openModal('ask-question')}
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2 rounded-full text-xs font-bold shadow-sm transition-all"
          >
            Post Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="ios-liquid-card p-5 card-soft-hover shadow-hi-fi-md liquid-sheen space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                    {q.courseCode}
                  </span>
                  <span className="font-semibold text-zinc-300 text-xs">
                    {q.courseName}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Asked by <strong className="text-zinc-200">{q.authorName}</strong> ({q.authorYear}) · {q.timeAgo}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">
                  {q.title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {q.body}
                </p>
              </div>

              {/* Endorsed Answer Preview */}
              {q.topAnswerSnippet && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{q.topAnswerAuthor}</span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed font-medium">
                    "{q.topAnswerSnippet}"
                  </p>
                </div>
              )}

              <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleUpvoteQuestion(q.id)}
                    className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all text-xs ${
                      q.hasUpvoted
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                        : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{q.upvotesCount}</span>
                  </button>

                  <span className="text-zinc-400 font-semibold text-xs">
                    {q.answersCount} answers
                  </span>
                </div>

                <button
                  onClick={() => openModal('ask-question')}
                  className="text-indigo-400 hover:text-indigo-300 font-extrabold text-xs transition-colors"
                >
                  Reply to Thread &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
