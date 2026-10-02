import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { CampusService } from '../../types';

export const CampusServiceModal: React.FC = () => {
  const { modalData, closeModal, triggerCelebration } = useApp();
  const [requestedService, setRequestedService] = useState<string | null>(null);

  const srv: CampusService = modalData;
  if (!srv) return null;

  const handleRequest = (service: string) => {
    setRequestedService(service);
    triggerCelebration();
  };

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
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full">
            {srv.department}
          </span>
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
              {srv.name}
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {srv.location} · {srv.hours}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-xs space-y-1.5">
            <p className="text-zinc-300 leading-relaxed font-normal">
              {srv.description}
            </p>
            <div className="pt-2.5 flex flex-col sm:flex-row gap-3 text-zinc-400 border-t border-white/[0.08] mt-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-white">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> {srv.contactPhone}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> {srv.contactEmail}
              </span>
            </div>
          </div>

          {/* Quick Online Services */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px]">
              Instant Student Self-Service
            </h3>
            <div className="space-y-1.5">
              {srv.quickServices.map((qs, i) => {
                const isSelected = requestedService === qs;
                return (
                  <div
                    key={i}
                    onClick={() => handleRequest(qs)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-sm'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-zinc-200'
                    }`}
                  >
                    <span className="font-medium">{qs}</span>
                    <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {isSelected ? 'Requested ✓' : 'Initiate'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-end p-4 sm:p-5 border-t border-white/[0.08] bg-[#0E0F17]">
          <button
            onClick={closeModal}
            className="px-6 py-2.5 text-xs rounded-full font-bold bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
