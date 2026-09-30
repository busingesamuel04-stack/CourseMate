import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
} from 'lucide-react';

export const FocusSessionModal: React.FC = () => {
  const { modalData, closeModal, logStudyTime, triggerCelebration, courses } = useApp();

  const totalMinutes = modalData?.availableMinutes || 25;
  const courseCode = modalData?.courseCode || courses[0]?.code || 'HEC1207';
  const topic = modalData?.topic || `${courseCode} Core Active Recall`;

  const [timeLeft, setTimeLeft] = useState(totalMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [checklist, setChecklist] = useState([
    { id: '1', text: `Active Recall: Write down core ${courseCode} definitions from memory`, done: false },
    { id: '2', text: 'Solve 2 key application drills without consulting textbook', done: false },
    { id: '3', text: 'Synthesize summary notes & review weak concepts', done: false },
  ]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      logStudyTime(totalMinutes);
      triggerCelebration();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const handleFinishEarly = () => {
    const elapsedMins = Math.max(
      1,
      Math.round((totalMinutes * 60 - timeLeft) / 60)
    );
    logStudyTime(elapsedMins);
    closeModal();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.round(
    ((totalMinutes * 60 - timeLeft) / (totalMinutes * 60)) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-400" />
            Deep Focus Session
          </span>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course & Topic */}
        <div className="text-center space-y-1">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
            {courseCode}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {topic}
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            Eliminate distractions. Focus on active recall and deliberate practice.
          </p>
        </div>

        {/* Digital Timer Display Well */}
        <div className="flex flex-col items-center justify-center py-6 px-6 rounded-3xl bg-[#090A0E] border border-white/[0.06]">
          <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tighter text-white tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Progress Bar */}
          <div className="w-56 h-2 rounded-full bg-white/[0.08] overflow-hidden mt-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tactile Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-white/[0.1] hover:bg-white/[0.16] text-white border border-white/[0.12]'
                : 'bg-white hover:bg-zinc-100 text-black shadow-white/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(totalMinutes * 60);
            }}
            className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
        </div>

        {/* Focus Checklist */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
            <span>Deliberate Recall Goals</span>
            <span>
              {checklist.filter((c) => c.done).length}/{checklist.length} Done
            </span>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                  item.done
                    ? 'bg-white/[0.02] border border-white/[0.04] line-through text-zinc-500'
                    : 'bg-white/[0.04] border border-white/[0.06] text-zinc-200 hover:border-white/[0.12]'
                }`}
              >
                <span className="font-medium leading-relaxed">{item.text}</span>
                <button className="shrink-0">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600 hover:text-indigo-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Finish Early Action */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleFinishEarly}
            className="text-xs font-semibold text-zinc-400 hover:text-white underline transition-colors"
          >
            Complete Session & Log Time
          </button>
        </div>
      </div>
    </div>
  );
};
