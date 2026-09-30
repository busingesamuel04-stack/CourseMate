import React, { useState } from 'react';
import { Flame, Plus, Minus } from 'lucide-react';

interface SkeuomorphicDialProps {
  currentValue: number;
  maxValue: number;
  unit?: string;
  title: string;
  subtitle?: string;
  onValueChange?: (val: number) => void;
  accentColor?: string;
}

export const SkeuomorphicDialWidget: React.FC<SkeuomorphicDialProps> = ({
  currentValue,
  maxValue,
  unit = 'h',
  title,
  subtitle,
  onValueChange,
}) => {
  const [val, setVal] = useState(currentValue);

  const percentage = Math.min(Math.round((val / maxValue) * 100), 100);
  // Circle perimeter for r = 58
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;
  // Rotation angle for dial needle/knob (-135deg to +135deg)
  const rotationDeg = -135 + (270 * percentage) / 100;

  const handleAdjust = (delta: number) => {
    const next = Math.max(0, Math.min(maxValue + 10, val + delta));
    setVal(next);
    if (onValueChange) onValueChange(next);
  };

  return (
    <div className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md relative overflow-hidden flex flex-col justify-between">
      {/* Liquid specular sheen */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-[28px]" />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div>
          <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider">
            Study Target
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Soft Lavender Focus Badge */}
        <div className="bg-[#1A1C2B] border border-white/[0.08] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <Flame className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/30" />
          <span className="text-xs font-bold text-white tabular-nums">
            {percentage}% Focus
          </span>
        </div>
      </div>

      {/* Main Circular Gauge Assembly */}
      <div className="relative flex flex-col items-center justify-center py-2 relative z-10">
        {/* Outer Concave Dial Bed with Soft Ambient Glow */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full skeuo-dial-surface flex items-center justify-center p-3 select-none">
          {/* Radial Tick Marks (Subtle engraved notches) */}
          <div className="absolute inset-2 rounded-full pointer-events-none opacity-30">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white/40 origin-[50%_96px] sm:origin-[50%_104px]"
                style={{ transform: `rotate(${deg}deg)` }}
              />
            ))}
          </div>

          {/* SVG Glow Gauge Arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-135 pointer-events-none" viewBox="0 0 140 140">
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#1C1F2E"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
            />
            {/* Soft Lavender / Blue Accent Gradient */}
            <defs>
              <linearGradient id="gaugeLavenderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#818CF8" floodOpacity="0.4" />
              </filter>
            </defs>
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#gaugeLavenderGrad)"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              filter="url(#gaugeGlow)"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* 3D Convex Center Rotary Knob */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full skeuo-dial-knob flex flex-col items-center justify-center p-3 text-center z-10 cursor-pointer active:scale-98 transition-transform">
            {/* Top specular highlight rim */}
            <div className="absolute top-1 left-3 right-3 h-5 bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-60 pointer-events-none" />

            {/* Rotary Pointer Notch pinned to outer circumference of knob, never overlapping center text */}
            <div
              className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${rotationDeg}deg)` }}
            >
              <div className="mx-auto w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818CF8] mt-1.5" />
            </div>

            {/* Central Numerical Readout */}
            <div className="leading-tight">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                {val}
                <span className="text-sm sm:text-base font-semibold text-zinc-400 ml-0.5">
                  {unit}
                </span>
              </span>
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                of {maxValue}{unit} Goal
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Controls with Tactile Raised Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => handleAdjust(-1)}
            className="circle-button-skeuo shadow-hi-fi-sm text-zinc-300 hover:text-white"
            title="Decrease 1 hour"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="skeuo-inset shadow-hi-fi-inset px-4 py-1.5 rounded-full text-xs font-bold text-zinc-300 tabular-nums">
            {val} hrs logged
          </div>

          <button
            onClick={() => handleAdjust(1)}
            className="circle-button-skeuo shadow-hi-fi-sm text-zinc-300 hover:text-white"
            title="Log 1 additional focus hour"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
