import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Briefcase,
  Search,
  ChevronRight,
} from 'lucide-react';

interface OpportunitiesPageProps {
  onBack: () => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = () => {
  const { opportunities, openModal, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const types = ['All', 'internship', 'scholarship', 'job', 'competition', 'fellowship'];

  const scopedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => !opp.university || opp.university === activeUni);
  }, [opportunities, activeUni]);

  const filtered = useMemo(() => {
    return scopedOpportunities.filter((opp) => {
      const matchesType = selectedType === 'All' || opp.type === selectedType;
      const matchesSearch =
        !search.trim() ||
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.organization.toLowerCase().includes(search.toLowerCase()) ||
        opp.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [scopedOpportunities, selectedType, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#059669] via-[#047857] to-[#064E3B] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Growth & Careers
              </span>
              <span>·</span>
              <span>{scopedOpportunities.length} Open Positions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Opportunities & Grants
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Curated student internships, technology innovation grants, research fellowships, and hackathons tailored to your enrolled faculty.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Type Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search internships, companies, or hackathons..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap capitalize transition-all ${
                  selectedType === t
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <Briefcase className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No opportunities found</h3>
          <p className="text-xs text-zinc-400">
            No listings matched your criteria. Select "All" to view all active placements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              onClick={() => openModal('opportunity-detail', opp)}
              className="ios-liquid-card p-5 card-soft-hover cursor-pointer shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                    {opp.type}
                  </span>
                  <span className="font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    Due: {opp.deadline}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {opp.title}
                </h3>

                <p className="text-xs font-semibold text-zinc-300 truncate">
                  {opp.organization} · {opp.location}
                </p>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {opp.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="font-bold text-white tabular-nums">
                  {opp.stipendOrAward}
                </span>

                <span className="text-indigo-400 group-hover:text-indigo-300 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-xs">
                  <span>View & Apply</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
