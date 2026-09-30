import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Calendar,
  Search,
  Plus,
  Check,
  MapPin,
} from 'lucide-react';

interface EventsPageProps {
  onBack: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = () => {
  const { campusEvents, toggleRsvpEvent, addCampusEventToPlanner, openModal, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Technology', 'Academic', 'Careers', 'Clubs', 'Sports', 'Student Life'];

  const scopedEvents = useMemo(() => {
    return campusEvents.filter((evt) => !evt.university || evt.university === activeUni);
  }, [campusEvents, activeUni]);

  const filtered = useMemo(() => {
    return scopedEvents.filter((evt) => {
      const matchesCategory =
        selectedCategory === 'All' || evt.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        evt.title.toLowerCase().includes(search.toLowerCase()) ||
        evt.location.toLowerCase().includes(search.toLowerCase()) ||
        evt.organizer.toLowerCase().includes(search.toLowerCase()) ||
        evt.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [scopedEvents, selectedCategory, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Activity & Life
              </span>
              <span>·</span>
              <span>{scopedEvents.length} Events Listed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campus Events & Workshops
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Explore hackathons, academic revision intensives, corporate career clinics, and varsity sports. RSVP in 1-tap and sync to your timetable.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, organizer, or venue..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <Calendar className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No events found</h3>
          <p className="text-xs text-zinc-400">
            No campus events match "{search}". Reset your search or select "All" to browse the full schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className={`ios-liquid-card p-5 card-soft-hover shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-3.5 ${
                evt.isTomorrow ? 'ring-2 ring-indigo-500/50 shadow-indigo-500/20' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                      {evt.category}
                    </span>
                    {evt.isTomorrow && (
                      <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse text-[9px]">
                        Tomorrow
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-zinc-400 bg-[#1A1C2B] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                    {evt.rsvpCount} attending
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    Organized by <strong className="text-zinc-200">{evt.organizer}</strong>
                  </p>
                </div>

                <div className="space-y-1 text-xs text-zinc-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-zinc-200">{evt.date} · {evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                  {evt.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <button
                  onClick={() => openModal('event-detail', evt)}
                  className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Full Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addCampusEventToPlanner(evt)}
                    className="bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] px-3 py-1.5 rounded-full text-xs font-bold text-zinc-300 hover:text-white shadow-xs flex items-center gap-1 transition-all"
                    title="Add to CourseMate Planner"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add to Planner</span>
                  </button>

                  <button
                    onClick={() => toggleRsvpEvent(evt.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                      evt.isRsvpd
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold'
                        : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    }`}
                  >
                    {evt.isRsvpd ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>RSVP'd</span>
                      </>
                    ) : (
                      <span>RSVP</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
