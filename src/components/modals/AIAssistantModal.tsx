import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  BookOpen,
  Layers,
  Award,
  X,
  RefreshCw,
  CheckCircle2,
  Flame,
} from 'lucide-react';

export const AIAssistantModal: React.FC = () => {
  const {
    modalData,
    closeModal,
    courses,
    priorities,
    triggerCelebration,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'explain' | 'flashcards' | 'quiz' | 'coach'>(
    modalData?.initialTab || 'explain'
  );

  const [selectedCourseCode, setSelectedCourseCode] = useState(
    modalData?.courseCode || courses[0]?.code || 'HEC1207'
  );
  const [topicInput, setTopicInput] = useState(modalData?.topic || (courses[0]?.name ? `${courses[0].name} Core Concepts` : 'Core Concepts'));

  // Loading & Result states
  const [loading, setLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState<any>(null);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [coachResult, setCoachResult] = useState<any>(null);
  const [cardsSaved, setCardsSaved] = useState(false);

  // 1. Explain Topic handler
  const handleExplainTopic = async () => {
    if (!topicInput.trim()) return;
    setLoading(true);
    setExplanationResult(null);

    try {
      const res = await fetch('/api/ai/explain-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourseCode,
          topic: topicInput,
          context: 'Undergraduate Computer Science & Engineering degree',
        }),
      });
      const data = await res.json();
      setExplanationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Flashcards handler
  const handleGenerateCards = async () => {
    if (!topicInput.trim()) return;
    setLoading(true);
    setCardsSaved(false);

    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourseCode,
          topic: topicInput,
        }),
      });
      const data = await res.json();
      setGeneratedCards(data.cards || []);
      triggerCelebration();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Quiz handler
  const handleGenerateQuiz = async () => {
    if (!topicInput.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourseCode,
          topic: topicInput,
        }),
      });
      const data = await res.json();
      setGeneratedQuiz(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Consult Coach handler
  const handleConsultCoach = async () => {
    setLoading(true);
    setCoachResult(null);

    try {
      const res = await fetch('/api/ai/study-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDeadlines:
            priorities.length > 0
              ? priorities.slice(0, 3).map((p) => ({
                  course: p.courseCode,
                  title: p.title,
                  dueInHours: 48,
                }))
              : courses.slice(0, 2).map((c, i) => ({
                  course: c.code,
                  title: `${c.name} Assessment`,
                  dueInHours: (i + 1) * 36,
                })),
        }),
      });
      const data = await res.json();
      setCoachResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 fill-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                CourseMate AI Study Assistant
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Powered by Gemini · Grounded in your courses & syllabus
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#090A0E] border border-white/[0.06] text-xs">
          {[
            { id: 'explain', label: 'Explain', icon: BookOpen },
            { id: 'flashcards', label: 'Cards', icon: Layers },
            { id: 'quiz', label: 'Quiz', icon: Award },
            { id: 'coach', label: 'Coach', icon: Flame },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as any);
                if (id === 'coach' && !coachResult) {
                  handleConsultCoach();
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Input Parameters for Topic & Course */}
        {activeTab !== 'coach' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Target Course
              </label>
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Topic or Syllabus Concept
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Red-Black Tree Rotations, BCNF..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={() => {
                    if (activeTab === 'explain') handleExplainTopic();
                    if (activeTab === 'flashcards') handleGenerateCards();
                    if (activeTab === 'quiz') handleGenerateQuiz();
                  }}
                  disabled={loading || !topicInput.trim()}
                  className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Generate</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. EXPLAIN TOPIC TAB */}
        {activeTab === 'explain' && (
          <div className="space-y-4 text-xs">
            {!explanationResult && !loading && (
              <div className="p-6 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] text-center space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="font-bold text-white text-sm">
                  Concept Breakdown & Active Recall
                </h4>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Type any concept above or choose from your course syllabus. Gemini will break it down into an intuitive explanation, 3 revision takeaways, and an active recall challenge.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                  {['Red-Black Trees', 'BCNF Decomposition', 'TCP Congestion Control', 'Virtual Memory Paging'].map(
                    (sample) => (
                      <button
                        key={sample}
                        onClick={() => {
                          setTopicInput(sample);
                        }}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold py-1 px-3 rounded-full hover:bg-indigo-500/30 transition-colors"
                      >
                        {sample}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="font-bold text-zinc-200">
                  Formulating clear academic breakdown with Gemini 3.8 Flash...
                </p>
              </div>
            )}

            {explanationResult && (
              <div className="space-y-3.5">
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                    {explanationResult.courseCode} · Conceptual Breakdown
                  </span>
                  <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                    {explanationResult.explanation}
                  </p>
                </div>

                {/* Key Takeaways */}
                {explanationResult.keyTakeaways && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      High-Yield Exam Takeaways
                    </h4>
                    <div className="space-y-1.5">
                      {explanationResult.keyTakeaways.map((point: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-medium">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Challenge */}
                {explanationResult.practicePrompt && (
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Active Recall Challenge
                    </span>
                    <p className="text-xs font-bold text-white mt-1">
                      {explanationResult.practicePrompt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. MAKE FLASHCARDS TAB */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4 text-xs">
            {loading && (
              <div className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="font-bold text-zinc-200">
                  Synthesizing active recall questions from syllabus...
                </p>
              </div>
            )}

            {generatedCards.length > 0 && !loading && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">
                    Generated Flashcards ({generatedCards.length})
                  </h4>
                  <button
                    onClick={() => {
                      setCardsSaved(true);
                      triggerCelebration();
                    }}
                    className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full hover:bg-indigo-500/30 transition-colors"
                  >
                    {cardsSaved ? 'Saved to Decks ✓' : 'Save to Study Decks'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generatedCards.map((card, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] space-y-2"
                    >
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                        Card {i + 1}
                      </span>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        {card.front}
                      </p>
                      <div className="pt-2 border-t border-white/[0.08] text-xs text-zinc-400">
                        {card.back}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CREATE QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 text-xs">
            {loading && (
              <div className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="font-bold text-zinc-200">
                  Creating 3-question multiple choice test...
                </p>
              </div>
            )}

            {generatedQuiz && !loading && (
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">
                  {generatedQuiz.title}
                </h4>
                <div className="space-y-3">
                  {generatedQuiz.questions?.map((q: any, qi: number) => (
                    <div
                      key={qi}
                      className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] space-y-2.5"
                    >
                      <p className="font-bold text-white text-sm">
                        {qi + 1}. {q.question}
                      </p>
                      <div className="space-y-1.5">
                        {q.options?.map((opt: string, oi: number) => (
                          <div
                            key={oi}
                            className={`p-2.5 rounded-xl border text-xs ${
                              oi === q.correctIndex
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold'
                                : 'border-white/[0.08] text-zinc-300 bg-white/[0.02]'
                            }`}
                          >
                            <span>{opt}</span>
                            {oi === q.correctIndex && ' (Correct Answer)'}
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400 italic">
                        Rationale: {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. STUDY COACH TAB */}
        {activeTab === 'coach' && (
          <div className="space-y-4 text-xs">
            {loading && (
              <div className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="font-bold text-zinc-200">
                  Analyzing current deadlines and course workloads with Gemini...
                </p>
              </div>
            )}

            {coachResult && !loading && (
              <div className="space-y-3.5">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                      Target Focus: {coachResult.recommendedCourse}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      Optimal 45m Block
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {coachResult.topic}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    {coachResult.coachingAdvice}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Recommended 3-Step Execution
                  </h4>
                  <div className="space-y-1.5">
                    {coachResult.actionSteps?.map((step: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-xs">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/[0.08]">
          <button
            onClick={closeModal}
            className="px-6 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
