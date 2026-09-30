import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Zap,
  Check,
} from 'lucide-react';

interface ChallengesPageProps {
  onBack: () => void;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = () => {
  const { campusChallenges, toggleJoinChallenge, student } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner with XP Meter */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Student Engagement & Gamification
              </span>
              <span>·</span>
              <span>Level 4 Scholar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campus Challenges & Badges
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Accept weekly academic and coding sprints. Completing study sessions in Planner automatically advances your challenge progress meters and awards XP!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md text-center border border-white/15 shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 font-extrabold text-2xl">
              <Zap className="w-6 h-6 fill-amber-300" />
              <span>{student.xpPoints || 1240}</span>
            </div>
            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mt-0.5">
              Total XP Earned
            </p>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campusChallenges.map((ch) => (
          <div
            key={ch.id}
            className="ios-liquid-card p-5 card-soft-hover shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                  {ch.category}
                </span>
                <span className="font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-300" />
                  +{ch.xpReward} XP
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white leading-snug">
                  {ch.title}
                </h3>
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                  Reward Badge: <strong className="text-zinc-200">{ch.badge}</strong> · {ch.deadline}
                </p>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {ch.description}
              </p>

              {/* Progress Meter */}
              {ch.progressPercent !== undefined && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                    <span>Sprint Milestone Progress</span>
                    <span className="text-indigo-400">{ch.progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181A27] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${ch.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">
                {ch.participantsCount} peers participating
              </span>

              <button
                onClick={() => toggleJoinChallenge(ch.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                  ch.isJoined
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                }`}
              >
                {ch.isJoined ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Active Challenge</span>
                  </>
                ) : (
                  <span>Accept Challenge</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
