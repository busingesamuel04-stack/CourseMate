import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, MapPin, Users, Bookmark, Check, Plus, Sparkles } from 'lucide-react';
import { CampusEvent } from '../../types';

export const CampusEventModal: React.FC = () => {
  const { modalData, closeModal, toggleRsvpEvent, toggleSaveEvent, addCampusEventToPlanner } = useApp();
  const event = modalData as CampusEvent;

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#13141D] border border-white/[0.1] w-full max-w-lg p-6 shadow-2xl space-y-5 rounded-3xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                {event.category}
              </span>
              <span className="text-[11px] font-bold text-zinc-400">
                {event.sourceLabel}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {event.title}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white">{event.date}</p>
              <p className="text-[11px] text-zinc-400">{event.time}</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] flex items-center gap-3">
            <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white truncate">{event.location}</p>
              <p className="text-[11px] text-zinc-400">{event.organizer}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            About this Event
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            {event.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium py-1 px-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">
              {event.rsvpCount} students attending
            </span>
          </div>
          <span className="text-[11px] text-indigo-300 font-semibold">
            {event.isRsvpd ? 'You are attending ✓' : 'Spots filling up'}
          </span>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => toggleSaveEvent(event.id)}
              className={`w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center transition-colors ${
                event.isSaved ? 'text-indigo-400' : 'text-zinc-400'
              }`}
              title={event.isSaved ? 'Saved' : 'Save Event'}
            >
              <Bookmark className={`w-4 h-4 ${event.isSaved ? 'fill-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                addCampusEventToPlanner(event);
                closeModal();
              }}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-zinc-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add to Planner</span>
            </button>

            <button
              onClick={() => toggleRsvpEvent(event.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transition-all ${
                event.isRsvpd
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-zinc-100 text-black'
              }`}
            >
              {event.isRsvpd ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>RSVP Confirmed</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>RSVP to Attend</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
