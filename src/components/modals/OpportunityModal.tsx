import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckCircle2,
} from 'lucide-react';
import { CampusOpportunity } from '../../types';

export const OpportunityModal: React.FC = () => {
  const { modalData, closeModal, triggerCelebration } = useApp();
  const [applied, setApplied] = useState(false);

  const opp: CampusOpportunity = modalData;
  if (!opp) return null;

  const handleApply = () => {
    setApplied(true);
    triggerCelebration();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full">
            {opp.type} · Deadline {opp.deadline}
          </span>
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
            {opp.title}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {opp.organization} · {opp.location}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Stipend / Award
          </span>
          <p className="text-base font-bold text-emerald-300 mt-0.5">
            {opp.stipendOrAward}
          </p>
        </div>

        <div className="space-y-1.5 text-xs">
          <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px]">
            Opportunity Overview
          </h3>
          <p className="text-zinc-300 leading-relaxed font-normal">
            {opp.description}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px]">
            Eligibility & Requirements
          </h3>
          <div className="space-y-1.5">
            {opp.requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-zinc-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{req}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleApply}
            className={`px-7 py-2.5 rounded-full text-xs font-bold transition-all shadow-md ${
              applied
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-zinc-100 text-black'
            }`}
          >
            {applied ? 'Application Started ✓' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
