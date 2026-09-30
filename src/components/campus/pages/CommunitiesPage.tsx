import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Check,
  ChevronRight,
} from 'lucide-react';

interface CommunitiesPageProps {
  onBack: () => void;
}

export const CommunitiesPage: React.FC<CommunitiesPageProps> = () => {
  const { campusCommunities, toggleJoinCommunity, openModal, courses, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'My Courses', 'Programme', 'Clubs', 'Interests'];

  const scopedCommunities = useMemo(() => {
    return campusCommunities.filter((c) => !c.university || c.university === activeUni);
  }, [campusCommunities, activeUni]);

  const filtered = useMemo(() => {
    return scopedCommunities.filter((c) => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.recentPostSnippet.toLowerCase().includes(search.toLowerCase()) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [scopedCommunities, selectedCategory, search]);

  const joinedCount = scopedCommunities.filter((c) => c.isJoined).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Category Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#312E81] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Interaction Hub
              </span>
              <span>·</span>
              <span>{joinedCount} Joined</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Course Communities
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Connect with classmates enrolled in your courses, share lecture summaries, ask questions, and collaborate with your academic cohorts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openModal('ask-question')}
              className="bg-white hover:bg-zinc-100 text-black font-extrabold px-5 py-2.5 rounded-full text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ask in Community</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search course code (e.g. ${courses[0]?.code || 'HEC1207'}), topic, or discussion...`}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Category Filter Chips */}
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

      {/* Communities Grid */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <Users className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No communities found</h3>
          <p className="text-xs text-zinc-400">
            No matching cohorts for "{search}". Try searching another course code or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((comm) => (
            <div
              key={comm.id}
              className="ios-liquid-card p-5 card-soft-hover shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-3.5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0"
                    style={{ backgroundColor: comm.avatarColor }}
                  >
                    {comm.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                      {comm.tag}
                    </span>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">
                      {comm.memberCount} enrolled
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-white line-clamp-1">
                    {comm.name}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {comm.unreadDiscussionsCount} active discussions today
                  </p>
                </div>

                {/* Recent Discussion Snippet */}
                <div className="p-3 rounded-2xl bg-[#161826] border border-white/[0.06] text-[11px] text-zinc-300">
                  <p className="line-clamp-2 italic font-medium">
                    "{comm.recentPostSnippet}"
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold mt-1.5 pt-1.5 border-t border-white/[0.06]">
                    <span>{comm.recentPostAuthor}</span>
                    <span>{comm.recentPostTime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <button
                  onClick={() => openModal('community-detail', comm)}
                  className="text-indigo-400 hover:text-indigo-300 font-extrabold text-xs flex items-center gap-0.5 transition-colors"
                >
                  <span>Open Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleJoinCommunity(comm.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                    comm.isJoined
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                  }`}
                >
                  {comm.isJoined ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>+ Join</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
