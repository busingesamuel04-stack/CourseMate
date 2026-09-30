import React from 'react';
import { useApp } from '../../../context/AppContext';

interface PulsePageProps {
  onBack: () => void;
}

export const PulsePage: React.FC<PulsePageProps> = () => {
  const { campusPulse, voteCampusPulse } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#312E81] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Campus Feeling
              </span>
              <span>·</span>
              <span>{campusPulse.totalVotes} Student Votes Recorded</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Pulse & Live Ticker
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Real-time student sentiment polls, live library & lab workstation statuses, power generator updates, and campus discussion feeds.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Poll + Live Bulletin Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Interactive Poll (7 cols) */}
        <div className="md:col-span-7 ios-liquid-card p-6 shadow-hi-fi-md liquid-sheen space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
              Today's Live Question
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug">
              {campusPulse.question}
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Tap an option to record your anonymous vote and see immediate student percentages.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {campusPulse.options.map((opt) => {
              const pct = Math.round((opt.votes / campusPulse.totalVotes) * 100);
              const isSelected = campusPulse.userVotedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => voteCampusPulse(opt.id)}
                  className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-semibold relative overflow-hidden transition-all border ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-sm'
                      : 'border-white/[0.08] hover:bg-white/[0.04] text-zinc-200'
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-500/20 rounded-2xl pointer-events-none transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="pr-3 leading-snug">{opt.text}</span>
                    <span className="font-extrabold text-xs text-white tabular-nums shrink-0">
                      {pct}% ({opt.votes})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Poll refreshes daily at midnight</span>
            <span className="text-indigo-400 font-bold">Total: {campusPulse.totalVotes} votes</span>
          </div>
        </div>

        {/* Right Column: Live Bulletin Ticker (5 cols) */}
        <div className="md:col-span-5 ios-liquid-card p-6 shadow-hi-fi-md liquid-sheen space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Live Status Bulletin
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Campus Facility Feed
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Now
            </span>
          </div>

          <div className="space-y-3">
            {campusPulse.quickStatuses.map((stat) => (
              <div
                key={stat.id}
                className="p-3.5 rounded-2xl bg-[#181A27] border border-white/[0.08] text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-extrabold text-white">{stat.user}</span>
                  <span>{stat.time}</span>
                </div>
                <p className="text-zinc-200 font-medium leading-relaxed">
                  {stat.text}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                  <span>#{stat.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
