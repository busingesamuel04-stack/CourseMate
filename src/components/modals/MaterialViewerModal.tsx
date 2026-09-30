import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { StudyMaterial } from '../../types';

export const MaterialViewerModal: React.FC = () => {
  const { modalData, closeModal, openModal } = useApp();

  const mat: StudyMaterial = modalData;
  if (!mat) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full uppercase">
              {mat.courseCode} · {mat.type.replace('_', ' ')}
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
            {mat.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Source: {mat.source} · Uploaded: {mat.uploadDate} · Size: {mat.fileSize}
          </p>
        </div>

        {/* Document Summary */}
        <div className="p-4 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-xs space-y-2">
          <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
            Academic Summary & Key Takeaways
          </h3>
          <p className="text-zinc-300 leading-relaxed font-normal">
            {mat.summary}
          </p>
        </div>

        {/* Learning Action / AI Flashcard Extraction */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border border-indigo-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 fill-indigo-400" />
              <span>Convert Notes to Active Recall</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
              Turn key definitions and worked problems into interactive flashcard drills.
            </p>
          </div>

          <button
            onClick={() => {
              closeModal();
              openModal('ai-assistant', {
                initialTab: 'flashcards',
                courseCode: mat.courseCode,
                topic: mat.title,
              });
            }}
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 text-xs rounded-full font-bold shadow-md shrink-0 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Generate Cards</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <button
            onClick={() => {
              closeModal();
              openModal('focus-session', {
                courseCode: mat.courseCode,
                topic: `Review: ${mat.title}`,
                availableMinutes: 25,
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-full flex items-center gap-1.5 shadow-md transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            <span>Start 25m Focus Review</span>
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
