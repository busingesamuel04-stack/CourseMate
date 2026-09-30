import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Users,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Flame,
  Briefcase,
  ShoppingBag,
  BarChart2,
  X,
  GraduationCap,
  Trophy,
  Zap,
  Star,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { ForYouFeedItem } from '../../types';
import { PaperBankPage } from './pages/PaperBankPage';

// Dedicated Sub-Pages
import { CommunitiesPage } from './pages/CommunitiesPage';
import { StudyGroupsPage } from './pages/StudyGroupsPage';
import { EventsPage } from './pages/EventsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ServicesPage } from './pages/ServicesPage';
import { PulsePage } from './pages/PulsePage';
import { ChallengesPage } from './pages/ChallengesPage';
import { MyCampusShelf } from './pages/MyCampusShelf';

export type CampusCategoryKey =
  | 'communities'
  | 'study-groups'
  | 'events'
  | 'opportunities'
  | 'questions'
  | 'marketplace'
  | 'services'
  | 'pulse'
  | 'challenges'
  | 'paper-bank';

export const CampusScreen: React.FC = () => {
  const {
    student,
    selectedUniversity,
    forYouFeedItems,
    campusCommunities,
    studyGroups,
    campusEvents,
    opportunities,
    campusQuestions,
    marketplaceItems,
    campusServices,
    campusPulse,
    openModal,
    addStudySessionToPlanner,
    toggleRsvpEvent,
    simulationState,
    courses,
  } = useApp();

  const activeUni = selectedUniversity || student?.university || 'ISBAT University';

  // Strict tenant scoping with defense-in-depth filtering
  const scopedFeedItems = useMemo(
    () => forYouFeedItems.filter((f) => !f.university || f.university === activeUni),
    [forYouFeedItems, activeUni]
  );
  const scopedEvents = useMemo(
    () => campusEvents.filter((e) => !e.university || e.university === activeUni),
    [campusEvents, activeUni]
  );
  const scopedStudyGroups = useMemo(
    () => studyGroups.filter((g) => !g.university || g.university === activeUni),
    [studyGroups, activeUni]
  );
  const scopedCommunities = useMemo(
    () => campusCommunities.filter((c) => !c.university || c.university === activeUni),
    [campusCommunities, activeUni]
  );
  const scopedOpportunities = useMemo(
    () => opportunities.filter((o) => !o.university || o.university === activeUni),
    [opportunities, activeUni]
  );
  const scopedQuestions = useMemo(
    () => campusQuestions.filter((q) => !q.university || q.university === activeUni),
    [campusQuestions, activeUni]
  );
  const scopedMarketplace = useMemo(
    () => marketplaceItems.filter((m) => !m.university || m.university === activeUni),
    [marketplaceItems, activeUni]
  );
  const scopedServices = useMemo(
    () => campusServices.filter((s) => !s.university || s.university === activeUni),
    [campusServices, activeUni]
  );

  // Mode: 'explore' vs 'my-campus'
  const [campusMode, setCampusMode] = useState<'explore' | 'my-campus'>('explore');

  // Active Category View: null (Main Campus Hub) or a dedicated category subpage
  const [activeCategoryView, setActiveCategoryView] = useState<CampusCategoryKey | null>(null);

  // Search & Hero index
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  // Loading Simulation Skeleton
  if (simulationState === 'loading') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="h-10 bg-zinc-800 rounded-2xl w-48" />
        <div className="h-12 bg-zinc-800 rounded-full w-full" />
        <div className="h-64 bg-zinc-800 rounded-[32px] w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-36 bg-zinc-800 rounded-[24px]" />
          <div className="h-36 bg-zinc-800 rounded-[24px]" />
        </div>
      </div>
    );
  }

  // Error State
  if (simulationState === 'error') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16 text-center py-16">
        <div className="ios-liquid-card p-8 max-w-md mx-auto rounded-[32px] space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-extrabold text-white">
            Couldn't load Campus updates
          </h2>
          <p className="text-xs text-zinc-400">
            We experienced a temporary disruption reaching university notice feeds.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white hover:bg-zinc-100 text-black px-6 py-2 rounded-full text-xs font-bold shadow-sm transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const handleForYouAction = (item: ForYouFeedItem) => {
    switch (item.actionType) {
      case 'view':
        openModal('exam-conflict');
        break;
      case 'rsvp':
        const targetEvent = campusEvents.find((e) => e.id === item.targetData?.eventId);
        if (targetEvent) openModal('event-detail', targetEvent);
        break;
      case 'join':
        const targetGrp = studyGroups.find((g) => g.id === item.targetData?.groupId);
        if (targetGrp) addStudySessionToPlanner(targetGrp);
        break;
      case 'apply':
        const targetOpp = opportunities.find((o) => o.id === item.targetData?.oppId);
        if (targetOpp) openModal('opportunity-detail', targetOpp);
        break;
      case 'discuss':
        openModal('ask-question');
        break;
      default:
        break;
    }
  };

  // The 9 Iconic Explore Campus Category Tiles
  const categoryTiles: {
    key: CampusCategoryKey;
    title: string;
    purpose: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    image: string;
  }[] = [
    {
      key: 'communities',
      title: 'Course Communities',
      purpose: 'Student interaction',
      badge: `${scopedCommunities.length} Active`,
      icon: Users,
      gradient: 'from-[#4F46E5] via-[#4338CA] to-[#312E81]',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'paper-bank',
      title: 'Past Papers & Syllabi',
      purpose: 'Exam prep resource bank',
      badge: 'Community Bank',
      icon: BookOpen,
      gradient: 'from-[#6D28D9] via-[#5B21B6] to-[#3B0764]',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'study-groups',
      title: 'Study Groups',
      purpose: 'Direct academic value',
      badge: `${scopedStudyGroups.length} Cohorts`,
      icon: Flame,
      gradient: 'from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'events',
      title: 'Campus Events',
      purpose: 'Campus activity',
      badge: `${scopedEvents.length} Events`,
      icon: Calendar,
      gradient: 'from-[#2563EB] via-[#1D4ED8] to-[#1E3A8A]',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'opportunities',
      title: 'Opportunities',
      purpose: 'Careers & grants',
      badge: `${scopedOpportunities.length} Open`,
      icon: Briefcase,
      gradient: 'from-[#059669] via-[#047857] to-[#064E3B]',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'questions',
      title: 'Questions & Discussions',
      purpose: 'Daily engagement',
      badge: `${scopedQuestions.length} Threads`,
      icon: Users,
      gradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'marketplace',
      title: 'Student Marketplace',
      purpose: 'Student economy',
      badge: `${scopedMarketplace.length} Listings`,
      icon: ShoppingBag,
      gradient: 'from-[#9333EA] via-[#7E22CE] to-[#581C87]',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'services',
      title: 'Campus Services',
      purpose: 'Practical utility',
      badge: `${scopedServices.length} Offices`,
      icon: GraduationCap,
      gradient: 'from-[#0891B2] via-[#0E7490] to-[#155E75]',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'pulse',
      title: 'Student Pulse & Polls',
      purpose: 'Live campus feeling',
      badge: `${campusPulse.totalVotes} Votes`,
      icon: BarChart2,
      gradient: 'from-[#6366F1] via-[#4F46E5] to-[#3730A3]',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    },
    {
      key: 'challenges',
      title: 'Campus Challenges',
      purpose: 'Optional engagement',
      badge: '+500 XP Active',
      icon: Trophy,
      gradient: 'from-[#A855F7] via-[#9333EA] to-[#6B21A8]',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const heroItems = scopedFeedItems.slice(0, 3);
  const currentHero = heroItems[heroIndex] || heroItems[0];

  // Helper to open a category sub-page
  const handleOpenCategory = (key: CampusCategoryKey) => {
    setActiveCategoryView(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------------------
  // IF IN DEDICATED CATEGORY PAGE
  // ---------------------------------------------------------------------------
  if (activeCategoryView) {
    const activeTile = categoryTiles.find((t) => t.key === activeCategoryView);
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24">
        {/* Clean Back Navigation Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141522] border border-white/[0.08] shadow-sm">
          <button
            onClick={() => setActiveCategoryView(null)}
            className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campus Hub</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400">
            <span>Campus</span>
            <span>/</span>
            <span className="text-white">{activeTile?.title || 'Category'}</span>
          </div>
        </div>

        {/* Render Dedicated Subpage Component */}
        {activeCategoryView === 'communities' && (
          <CommunitiesPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'study-groups' && (
          <StudyGroupsPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'events' && (
          <EventsPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'opportunities' && (
          <OpportunitiesPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'questions' && (
          <QuestionsPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'marketplace' && (
          <MarketplacePage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'services' && (
          <ServicesPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'pulse' && (
          <PulsePage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'challenges' && (
          <ChallengesPage onBack={() => setActiveCategoryView(null)} />
        )}
        {activeCategoryView === 'paper-bank' && (
          <PaperBankPage onBack={() => setActiveCategoryView(null)} />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN CAMPUS HUB VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Top Header & Shelf Switcher */}
      <header className="space-y-3.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Campus
              </h1>
              <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-extrabold uppercase">
                {activeUni.split(' ')[0]} Hub
              </span>

              {/* XP Meter */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-extrabold text-[11px]">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{student.xpPoints || 1240} XP</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-medium">
              Discover what's happening across your university that matters to you.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex p-1 rounded-2xl bg-[#13141F] border border-white/[0.08] text-xs font-extrabold shadow-inner">
              <button
                type="button"
                onClick={() => setCampusMode('explore')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  campusMode === 'explore'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Explore Hubs
              </button>
              <button
                type="button"
                onClick={() => setCampusMode('my-campus')}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  campusMode === 'my-campus'
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>My Campus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search across all 9 campus categories (${courses[0]?.code || 'HEC1207'}, study groups, events, jobs...)`}
            className="w-full pl-11 pr-10 py-3 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 circle-button-skeuo w-6 h-6 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Render My Campus Shelf Mode */}
      {campusMode === 'my-campus' ? (
        <MyCampusShelf
          onExplore={() => setCampusMode('explore')}
          onNavigateCategory={handleOpenCategory}
        />
      ) : (
        /* Render Main Explore Hub Mode */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* =====================================================================
              1. BILLBOARD HERO SPOTLIGHT
              ===================================================================== */}
          {currentHero && !searchQuery && (
            <section className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl bg-zinc-950 group border border-white/[0.1]">
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"
                alt="Campus Spotlight"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = '0';
                }}
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-70 group-hover:scale-105 transition-transform duration-700"
              />

              <div className="relative z-20 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[250px] sm:min-h-[280px]">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white/90">
                    <span className="bg-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white font-extrabold shadow-sm flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {currentHero.source}
                    </span>
                    <span>·</span>
                    <span className="text-zinc-300">{currentHero.timeLabel}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                    {currentHero.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed line-clamp-2">
                    {currentHero.body}
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/15">
                  <div className="text-[11px] text-zinc-300 font-medium">
                    <span className="text-zinc-400">Why it matters: </span>
                    <span className="font-bold text-white">{currentHero.whyItMatters}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 mr-2">
                      {heroItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            heroIndex === idx ? 'w-6 bg-indigo-500' : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleForYouAction(currentHero)}
                      className="bg-white hover:bg-zinc-100 text-black font-extrabold px-5 py-2.5 rounded-full text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-98 shrink-0"
                    >
                      <span>{currentHero.actionLabel}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =====================================================================
              2. EXPLORE CAMPUS: 2-COLUMN CATEGORY TILES
              ===================================================================== */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Explore Campus
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Tap any sphere below to enter its dedicated hub with complete resources and tools.
                </p>
              </div>
              <span className="text-xs font-bold text-zinc-400 hidden sm:inline">
                9 Specialized Hubs
              </span>
            </div>

            {/* 2-Column Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              {categoryTiles.map((tile) => {
                const IconComp = tile.icon;
                return (
                  <div
                    key={tile.key}
                    onClick={() => handleOpenCategory(tile.key)}
                    className={`relative rounded-[22px] sm:rounded-[26px] overflow-hidden p-4 sm:p-5 h-32 sm:h-36 flex flex-col justify-between cursor-pointer group shadow-lg bg-gradient-to-br ${tile.gradient} hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/[0.08]`}
                  >
                    <img
                      src={tile.image}
                      alt={tile.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0';
                      }}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:opacity-45 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
                        {tile.badge}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-0.5">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                        {tile.purpose}
                      </p>
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight drop-shadow-sm flex items-center justify-between">
                        <span>{tile.title}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =====================================================================
              3. CURATED QUICK SPOTLIGHT: HAPPENING SOON
              ===================================================================== */}
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Happening Soon</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Top upcoming events recommended for your programme
                </p>
              </div>

              <button
                onClick={() => handleOpenCategory('events')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5"
              >
                <span>See All Events ({scopedEvents.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scopedEvents.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => openModal('event-detail', evt)}
                  className="ios-liquid-card p-4 card-soft-hover cursor-pointer shadow-hi-fi-sm flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                        {evt.category}
                      </span>
                      {evt.isTomorrow && (
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                          Tomorrow
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-white line-clamp-1">{evt.title}</h4>
                    <p className="text-xs text-zinc-400 font-semibold">{evt.date} · {evt.time}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{evt.location}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">{evt.rsvpCount} attending</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRsvpEvent(evt.id);
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                        evt.isRsvpd
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white hover:bg-zinc-100 text-black shadow-xs'
                      }`}
                    >
                      {evt.isRsvpd ? 'RSVP ✓' : 'RSVP'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =====================================================================
              4. CURATED QUICK SPOTLIGHT: ACTIVE STUDY GROUPS
              ===================================================================== */}
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-4 h-4 text-violet-400" />
                  <span>Active Study Cohorts</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Peer study sessions matching your course schedule
                </p>
              </div>

              <button
                onClick={() => handleOpenCategory('study-groups')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5"
              >
                <span>See All Groups ({scopedStudyGroups.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {scopedStudyGroups.slice(0, 2).map((grp) => (
                <div
                  key={grp.id}
                  className="ios-liquid-card p-4 card-soft-hover shadow-hi-fi-sm flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                        {grp.courseCode}
                      </span>
                      <span className="font-semibold text-zinc-400">
                        {grp.membersCount}/{grp.maxMembers} peers enrolled
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">{grp.name}</h4>
                    <p className="text-xs text-zinc-400 font-medium">Topic: {grp.topic}</p>
                    <p className="text-[11px] text-zinc-500">{grp.schedule} · {grp.location}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                    <button
                      onClick={() => addStudySessionToPlanner(grp)}
                      className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <span>+ Sync to Planner</span>
                    </button>
                    <button
                      onClick={() => handleOpenCategory('study-groups')}
                      className="bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] px-3 py-1 rounded-full text-zinc-300 hover:text-white font-bold text-[11px] transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
