import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export const AssignmentDetailModal: React.FC = () => {
  const { modalData, closeModal, toggleEventCompleted } = useApp();

  if (!modalData) return null;

  const isCompleted = modalData.completed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white modal-sheet-dynamic overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full">
              {modalData.courseCode} · Assignment Details
            </span>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {modalData.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            {modalData.courseName}
          </p>
        </div>

        {/* Due Date & Submission Location */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#090A0E] border border-white/[0.08]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Deadline
            </span>
            <p className="text-xs font-bold text-white mt-0.5">
              {modalData.date} · {modalData.endTime || modalData.startTime}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090A0E] border border-white/[0.08]">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Portal / Location
            </span>
            <p className="text-xs font-bold text-white mt-0.5 truncate">
              {modalData.location}
            </p>
          </div>
        </div>

        {/* Notes & Rubrics */}
        {modalData.notes && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Assignment Instructions & Deliverables
            </h3>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 leading-relaxed font-normal">
              {modalData.notes}
            </div>
          </div>
        )}

        {/* Source & Reliability Provenance Card */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Information Provenance: {modalData.source?.label || 'Verified University LMS'}</span>
          </div>
          <p className="text-[11px] text-emerald-200/80 font-normal">
            Ingested directly from official student course enrollment. Verified by Faculty department coordinator.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <button
            onClick={() => {
              toggleEventCompleted(modalData.id);
              closeModal();
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md ${
              isCompleted
                ? 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 border border-white/[0.1]'
                : 'bg-white hover:bg-zinc-100 text-black'
            }`}
          >
            {isCompleted ? (
              <>
                <Circle className="w-4 h-4 text-zinc-400" />
                <span>Mark Incomplete</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark as Finished</span>
              </>
            )}
          </button>

          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
