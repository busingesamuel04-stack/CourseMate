import React, { useState } from 'react';
import { Sparkles, Calendar, BookOpen, Timer, Layers, ShieldCheck } from 'lucide-react';

interface SkeuomorphicPillBarProps {
  onSelectAction?: (action: string) => void;
}

export const SkeuomorphicPillBar: React.FC<SkeuomorphicPillBarProps> = ({ onSelectAction }) => {
  const [activePill, setActivePill] = useState<string>('Registration');
  const [focusToggle, setFocusToggle] = useState<boolean>(true);

  const pills = [
    { id: 'Timetable', label: 'Timetable', icon: Calendar, isHighlight: false },
    { id: 'Registration', label: 'AI Tutor', icon: Sparkles, isHighlight: true },
    { id: 'Notes', label: 'Notes', icon: BookOpen, isHighlight: false },
    { id: 'Timer', label: 'Timer', icon: Timer, isHighlight: false },
    { id: 'Cards', label: 'Flashcards', icon: Layers, isHighlight: false },
    { id: 'Portal', label: 'Portal Sync', icon: ShieldCheck, isHighlight: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight">
            Academic Quick Actions
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            Fast access tools and verified portals
          </p>
        </div>

        {/* Tactile 3D Toggle Switch (iOS dark style) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400">
            Auto-Sync
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={focusToggle}
            onClick={() => setFocusToggle(!focusToggle)}
            className={`w-12 h-6 rounded-full skeuo-inset shadow-hi-fi-inset p-0.5 transition-colors relative focus:outline-none ${
              focusToggle ? 'bg-indigo-500/25 border-indigo-500/40' : 'bg-[#181926]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${
                focusToggle
                  ? 'translate-x-6 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/30'
                  : 'translate-x-0 bg-zinc-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${focusToggle ? 'bg-white' : 'bg-zinc-600'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Grid of 6 Soft Rounded Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {pills.map(({ id, label, icon: Icon, isHighlight }) => {
          const isSelected = activePill === id;

          if (isHighlight) {
            return (
              <button
                key={id}
                onClick={() => {
                  setActivePill(id);
                  if (onSelectAction) onSelectAction(id);
                }}
                className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs cursor-pointer select-none active:scale-98 transition-all border border-white/20"
              >
                <Icon className="w-4 h-4 fill-white text-white drop-shadow-xs" />
                <span>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => {
                setActivePill(id);
                if (onSelectAction) onSelectAction(id);
              }}
              className={`bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] shadow-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs text-zinc-300 hover:text-white cursor-pointer select-none transition-all ${
                isSelected ? 'ring-2 ring-indigo-500/50 text-indigo-300 border-indigo-500/30' : ''
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
