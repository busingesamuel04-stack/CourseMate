import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export const ExamConflictModal: React.FC = () => {
  const { modalData, closeModal, triggerCelebration } = useApp();

  const conflict = modalData?.conflict;
  if (!conflict) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="relative w-full max-w-lg max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] bg-[#13141D] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Academic Source Discrepancy Flagged</span>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {modalData.courseCode}: {modalData.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              CourseMate detected two conflicting schedules for this examination from different academic channels.
            </p>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Source A: Official ISMIS */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{conflict.sourceA.name}</span>
              </div>
              <div className="space-y-1 text-zinc-300">
                <p className="font-bold text-base text-white">{conflict.sourceA.date}</p>
                <p className="text-zinc-400 font-medium">
                  Time: {conflict.sourceA.time}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold pt-1">
                  Verified Authority (High Reliability)
                </p>
              </div>
            </div>

            {/* Source B: Student-shared rep notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>{conflict.sourceB.name}</span>
              </div>
              <div className="space-y-1 text-zinc-300">
                <p className="font-bold text-base text-white">{conflict.sourceB.date}</p>
                <p className="text-zinc-400 font-medium">
                  Time: {conflict.sourceB.time}
                </p>
                <p className="text-[10px] text-amber-400 font-bold pt-1">
                  Informal Student Channel (Unverified)
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Guidance */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Resolution Recommendation
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              {conflict.resolutionRecommendation}
            </p>
            <div className="pt-1 text-[11px] text-zinc-500 font-medium">
              CourseMate prioritizes the official university portal by default to ensure you never miss an official exam.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/[0.08] bg-[#0E0F17]">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              triggerCelebration();
              closeModal();
            }}
            className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 rounded-full text-xs font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Confirm Official ISMIS Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};
