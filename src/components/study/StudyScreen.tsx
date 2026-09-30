import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Play,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Award,
  Layers,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Quiz } from '../../types';

export const StudyScreen: React.FC = () => {
  const {
    student,
    studyRecommendation,
    flashcardDecks,
    toggleCardMastered,
    addFlashcardDeck,
    quizzes,
    addQuiz,
    studyMaterials,
    openModal,
    triggerCelebration,
    logStudyTime,
    courses,
  } = useApp();

  // Active Flashcard Deck state
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const currentDeck = flashcardDecks[activeDeckIndex] || flashcardDecks[0];
  const currentCard = currentDeck?.cards?.[currentCardIndex] || currentDeck?.cards?.[0];

  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % currentDeck.cards.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) =>
      prev === 0 ? currentDeck.cards.length - 1 : prev - 1
    );
  };

  // Generate Flashcards using Gemini AI Engine
  const handleGenerateAIFlashcards = async () => {
    setIsGeneratingCards(true);
    const activeCourse = courses[0] || { code: 'HEC1207', name: 'Foundation of Computing' };
    try {
      const res = await fetch('/api/ai/generate-study-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: activeCourse.code,
          courseTitle: activeCourse.name,
          type: 'flashcards',
          topic: currentDeck?.title || `${activeCourse.code} Active Recall Core`,
        }),
      });
      const data = await res.json();
      if (data?.deck) {
        addFlashcardDeck(data.deck);
        setActiveDeckIndex(0);
        setCurrentCardIndex(0);
        setIsCardFlipped(false);
        // Direct persistence guarantee
        const updated = [data.deck, ...flashcardDecks];
        localStorage.setItem('coursemate_flashcard_decks', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to generate AI flashcards:', err);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // Generate Rapid Quiz using Gemini AI Engine
  const handleGenerateAIQuiz = async () => {
    setIsGeneratingQuiz(true);
    const activeCourse = courses[0] || { code: 'HEC1207', name: 'Foundation of Computing' };
    try {
      const res = await fetch('/api/ai/generate-study-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: activeCourse.code,
          courseTitle: activeCourse.name,
          type: 'quiz',
          topic: `${activeCourse.code} Rapid Drill`,
        }),
      });
      const data = await res.json();
      if (data?.quiz) {
        addQuiz(data.quiz);
        startQuiz(data.quiz);
        const updated = [data.quiz, ...quizzes];
        localStorage.setItem('coursemate_quizzes', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to generate AI quiz:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleSelectQuizOption = (index: number) => {
    if (quizSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmitQuizAnswer = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    setQuizSubmitted(true);
    const isCorrect =
      selectedAnswer === activeQuiz.questions[quizQuestionIdx].correctIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      triggerCelebration();
    }
  };

  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    if (quizQuestionIdx + 1 < activeQuiz.questions.length) {
      setQuizQuestionIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
    } else {
      // Quiz finished
      logStudyTime(activeQuiz.estimatedMinutes);
      // Persist quiz performance score to localStorage
      try {
        const perfKey = 'coursemate_quiz_performance';
        const existing = JSON.parse(localStorage.getItem(perfKey) || '[]');
        existing.push({
          quizId: activeQuiz.id,
          courseCode: activeQuiz.courseCode,
          score: quizScore,
          total: activeQuiz.questions.length,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(perfKey, JSON.stringify(existing));
      } catch {}
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Study & Retention Engine
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-medium">
            Active recall, focus timers, flashcards, and exam preparation
          </p>
        </div>

        {/* Study Streak Badge with Soft Lavender/Indigo Gradient */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-extrabold py-2 px-4 rounded-full flex items-center gap-2 shadow-md shadow-indigo-500/20">
            <Flame className="w-4 h-4 fill-white text-white" />
            <span>{student.studyStreakDays} Day Study Streak</span>
          </div>
        </div>
      </div>

      {/* 1. Core Feature: "What Should I Study Now?" Hero Recommendation */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md space-y-4 liquid-sheen">
        <div className="flex items-center justify-between">
          <span className="pill-tag-coral font-extrabold text-xs py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400 fill-indigo-400/30" />
            Smart Study Recommendation
          </span>
          <span className="text-xs font-bold text-zinc-400">
            {studyRecommendation.availableMinutes} min slot
          </span>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {studyRecommendation.courseCode}: {studyRecommendation.topic}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed max-w-2xl font-medium">
            {studyRecommendation.reason} Split into {studyRecommendation.activeRecallMinutes}m
            active recall and {studyRecommendation.practiceMinutes}m application drills.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => openModal('focus-session', studyRecommendation)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white w-full sm:w-auto px-7 py-3 rounded-full text-xs font-extrabold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Focus Session</span>
          </button>

          <button
            onClick={() =>
              openModal('ai-assistant', {
                initialTab: 'coach',
                courseCode: studyRecommendation.courseCode,
                topic: studyRecommendation.topic,
              })
            }
            className="bg-[#1C1E2D] hover:bg-[#25283B] border border-white/[0.08] w-full sm:w-auto py-3 px-6 rounded-full text-xs font-extrabold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            Ask AI Coach
          </button>
        </div>
      </section>

      {/* 2. Interactive Flashcards Practice Deck */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md space-y-4 liquid-sheen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white">
                Active Recall Flashcards
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Deck: {currentDeck?.courseCode || courses[0]?.code || 'All Courses'} · {currentDeck?.title || 'Core Foundations'}
            </p>
          </div>

          {/* Deck Switcher & AI Generator Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateAIFlashcards}
              disabled={isGeneratingCards}
              className="bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1.5 px-3.5 rounded-full flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Generate new active recall cards using Gemini AI"
            >
              <Sparkles className={`w-3 h-3 text-indigo-400 fill-indigo-400/30 ${isGeneratingCards ? 'animate-spin' : ''}`} />
              <span>{isGeneratingCards ? 'Generating...' : 'AI Flashcards'}</span>
            </button>

            {/* Recessed Inset Tab Bar */}
            <div className="flex items-center bg-[#13141F] border border-white/[0.08] p-1 rounded-full shadow-inner">
              {flashcardDecks.map((deck, idx) => (
                <button
                  key={deck.id}
                  onClick={() => {
                    setActiveDeckIndex(idx);
                    setCurrentCardIndex(0);
                    setIsCardFlipped(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeDeckIndex === idx
                      ? 'bg-white text-black font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {deck.courseCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Tactile Flashcard Surface / Skeleton State */}
        {isGeneratingCards ? (
          <div className="min-h-[220px] rounded-[28px] bg-gradient-to-b from-[#191B29] to-[#12131E] border border-indigo-500/40 shadow-xl p-6 flex flex-col justify-between select-none relative overflow-hidden animate-pulse">
            <div className="flex items-center justify-between">
              <span className="h-4 w-28 bg-indigo-500/30 rounded-full" />
              <span className="h-4 w-16 bg-white/10 rounded-full" />
            </div>
            <div className="space-y-3 py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-sm font-extrabold text-indigo-300">
                Generating Active Recall Cards with Gemini AI...
              </p>
              <p className="text-xs text-zinc-400 font-medium">
                Drafting curriculum-aligned conceptual question invariants
              </p>
            </div>
            <div className="h-3 w-40 bg-white/10 rounded-full mx-auto" />
          </div>
        ) : currentCard ? (
          <div
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className="min-h-[220px] rounded-[28px] bg-gradient-to-b from-[#191B29] to-[#12131E] border border-white/[0.08] shadow-xl p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all select-none relative overflow-hidden"
          >
            {/* Top Light Catch Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="pill-tag-coral font-bold text-[10px] uppercase tracking-wider">
                {isCardFlipped ? 'Answer & Explanation' : 'Question / Concept'}
              </span>
              <span className="font-bold text-zinc-400">
                Card {currentCardIndex + 1} of {currentDeck.cards.length}
              </span>
            </div>

            <div className="py-4">
              <p className="text-base sm:text-xl font-extrabold text-white whitespace-pre-line leading-relaxed">
                {isCardFlipped ? currentCard.back : currentCard.front}
              </p>
              {!isCardFlipped && currentCard.hint && (
                <p className="text-xs text-zinc-400 italic mt-2.5 font-medium">
                  Hint: {currentCard.hint}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-white/[0.08]">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                Tap anywhere to flip card
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardMastered(currentDeck.id, currentCard.id);
                }}
                className={`flex items-center gap-1.5 font-bold transition-all px-3 py-1 rounded-full ${
                  currentCard.mastered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentCard.mastered ? 'Mastered' : 'Mark as Mastered'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Card Controls with Tactile Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handlePrevCard}
            className="bg-[#191B29] hover:bg-[#202334] border border-white/[0.08] px-4 py-2 rounded-full text-xs font-bold text-zinc-300 hover:text-white shadow-xs transition-all"
          >
            &larr; Previous Card
          </button>
          <div className="text-xs text-zinc-400 font-bold tabular-nums">
            {currentDeck.cards.filter((c) => c.mastered).length} / {currentDeck.cards.length} Mastered
          </div>
          <button
            onClick={handleNextCard}
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2 text-xs rounded-full font-bold shadow-md transition-all"
          >
            Next Card &rarr;
          </button>
        </div>
      </section>

      {/* 3. Interactive Practice Assessment Quiz */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover space-y-4 liquid-sheen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white">
              Practice Assessment Quiz
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAIQuiz}
              disabled={isGeneratingQuiz}
              className="bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3.5 rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Generate new practice quiz using Gemini AI"
            >
              <Sparkles className={`w-3 h-3 mr-1 text-indigo-400 fill-indigo-400/30 ${isGeneratingQuiz ? 'animate-spin' : ''}`} />
              <span>{isGeneratingQuiz ? 'Generating...' : 'AI Create Quiz'}</span>
            </button>
            {activeQuiz && (
              <span className="text-xs font-extrabold text-zinc-200 bg-[#1C1E2D] px-3 py-1 rounded-full border border-white/[0.08]">
                Score: {quizScore} / {quizQuestionIdx + (quizSubmitted ? 1 : 0)}
              </span>
            )}
          </div>
        </div>

        {isGeneratingQuiz ? (
          <div className="p-6 rounded-2xl bg-[#181A27] border border-indigo-500/30 text-center space-y-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <p className="text-sm font-extrabold text-indigo-300">
              Assembling Rapid Assessment Quiz with Gemini AI...
            </p>
            <p className="text-xs text-zinc-400 font-medium">
              Formulating 3-question active recall drill with rationale explanations
            </p>
          </div>
        ) : !activeQuiz ? (
          quizzes.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-[#181A27] border border-white/[0.08]">
              <div>
                <span className="pill-tag-coral text-[10px] py-0.5 px-2 font-bold">
                  {quizzes[0].courseCode} · Rapid Drill
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  {quizzes[0].title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  {quizzes[0].questions.length} questions · ~{quizzes[0].estimatedMinutes} minutes
                </p>
              </div>
              <button
                onClick={() => startQuiz(quizzes[0])}
                className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 text-xs rounded-full font-bold shadow-md shrink-0 transition-all"
              >
                Start Rapid Quiz
              </button>
            </div>
          ) : null
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">
                Question {quizQuestionIdx + 1} of {activeQuiz.questions.length}
              </span>
              <span className="pill-tag-coral text-[10px] py-0.5 px-2 font-bold">
                {activeQuiz.courseCode}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-white">
              {activeQuiz.questions[quizQuestionIdx].question}
            </h3>

            {/* Tactile Options */}
            <div className="space-y-2.5">
              {activeQuiz.questions[quizQuestionIdx].options.map((opt, optIdx) => {
                const isSelected = selectedAnswer === optIdx;
                const isCorrect =
                  optIdx === activeQuiz.questions[quizQuestionIdx].correctIndex;

                let optionClass = 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-200';
                if (isSelected && !quizSubmitted) {
                  optionClass = 'border-2 border-indigo-500 bg-indigo-500/15 text-white font-extrabold shadow-sm';
                } else if (quizSubmitted) {
                  if (isCorrect) {
                    optionClass = 'border-2 border-emerald-500 bg-emerald-500/15 text-emerald-200 font-extrabold shadow-sm';
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'border-2 border-rose-500 bg-rose-500/15 text-rose-200';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectQuizOption(optIdx)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${optionClass}`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation when submitted */}
            {quizSubmitted && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-zinc-200">
                <span className="font-extrabold text-indigo-300">
                  Concept Rationale:
                </span>{' '}
                {activeQuiz.questions[quizQuestionIdx].explanation}
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-bold text-zinc-400 hover:text-white"
              >
                Exit Quiz
              </button>

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuizAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 text-xs rounded-full font-bold shadow-md disabled:opacity-40 transition-all"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuizQuestion}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white px-6 py-2.5 text-xs rounded-full font-extrabold shadow-md transition-all"
                >
                  {quizQuestionIdx + 1 < activeQuiz.questions.length
                    ? 'Next Question'
                    : 'Finish Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Verified Course Study Materials & Past Papers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white">
              Study Materials & Past Papers
            </h2>
          </div>
          <button
            onClick={() => openModal('source-connect')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Upload PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {studyMaterials.map((mat) => (
            <div
              key={mat.id}
              onClick={() => openModal('material-viewer', mat)}
              className="ios-liquid-card p-4 sm:p-5 card-soft-hover cursor-pointer transition-all flex flex-col justify-between group liquid-sheen select-none"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                  <span className="pill-tag-coral text-[10px] py-0.5 px-2 font-bold uppercase">
                    {mat.courseCode} · {mat.type.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-zinc-400">{mat.fileSize}</span>
                </div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {mat.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-medium">
                  {mat.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-400">{mat.source}</span>
                <span className="text-indigo-400 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
