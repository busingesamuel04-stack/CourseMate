import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Star,
  Users,
  Calendar,
  Flame,
  Trophy,
  Zap,
} from 'lucide-react';

interface MyCampusShelfProps {
  onExplore: () => void;
  onNavigateCategory: (category: any) => void;
}

export const MyCampusShelf: React.FC<MyCampusShelfProps> = ({ onNavigateCategory }) => {
  const {
    student,
    selectedUniversity,
    campusCommunities,
    campusEvents,
    studyGroups,
    campusChallenges,
    openModal,
  } = useApp();

  const activeUni = selectedUniversity || student?.university || 'ISBAT University';

  const myCommunities = campusCommunities.filter(
    (c) => (!c.university || c.university === activeUni) && c.isJoined
  );
  const myEvents = campusEvents.filter(
    (e) => (!e.university || e.university === activeUni) && (e.isRsvpd || e.isSaved)
  );
  const myStudyGroups = studyGroups.filter(
    (g) => (!g.university || g.university === activeUni) && g.isMember
  );
  const myChallenges = campusChallenges.filter(
    (ch) => (!ch.university || ch.university === activeUni) && ch.isJoined
  );

  const totalCount = myCommunities.length + myEvents.length + myStudyGroups.length + myChallenges.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Banner */}
      <div className="p-6 sm:p-7 rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-[#1E2036] via-[#161828] to-[#121320] border border-white/[0.1] text-white shadow-xl space-y-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                My Campus Shelf
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Personalized university commitments & active cohorts
              </p>
            </div>
          </div>
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">
            {totalCount} Commitments
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 relative z-10">
          <div className="p-3 rounded-2xl bg-[#141522] border border-white/[0.06] text-center">
            <p className="text-xl font-extrabold text-white">{myCommunities.length}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase">Communities</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#141522] border border-white/[0.06] text-center">
            <p className="text-xl font-extrabold text-white">{myEvents.length}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase">Events RSVP'd</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#141522] border border-white/[0.06] text-center">
            <p className="text-xl font-extrabold text-white">{myStudyGroups.length}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase">Study Cohorts</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#141522] border border-white/[0.06] text-center">
            <p className="text-xl font-extrabold text-indigo-400">{student.xpPoints || 1240}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase">XP Earned</p>
          </div>
        </div>
      </div>

      {/* 1. My Communities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>My Communities ({myCommunities.length})</span>
          </h3>
          <button
            onClick={() => onNavigateCategory('communities')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            All Communities &rarr;
          </button>
        </div>

        {myCommunities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#13141F] border border-white/[0.08] text-center text-xs text-zinc-400">
            You haven't joined any communities yet.{' '}
            <button
              onClick={() => onNavigateCategory('communities')}
              className="text-indigo-400 font-bold hover:underline"
            >
              Browse course cohorts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {myCommunities.map((comm) => (
              <div
                key={comm.id}
                className="ios-liquid-card p-4 card-soft-hover shadow-hi-fi-sm flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: comm.avatarColor }}
                  >
                    {comm.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {comm.name}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-bold">
                      {comm.unreadDiscussionsCount} active discussions
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-400 font-bold">Member</span>
                  <button
                    onClick={() => openModal('community-detail', comm)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] transition-colors"
                  >
                    Open Hub &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. My Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Events in My Planner ({myEvents.length})</span>
          </h3>
          <button
            onClick={() => onNavigateCategory('events')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            All Events &rarr;
          </button>
        </div>

        {myEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#13141F] border border-white/[0.08] text-center text-xs text-zinc-400">
            No events saved yet.{' '}
            <button
              onClick={() => onNavigateCategory('events')}
              className="text-indigo-400 font-bold hover:underline"
            >
              Browse upcoming events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {myEvents.map((evt) => (
              <div
                key={evt.id}
                className="ios-liquid-card p-4 card-soft-hover shadow-hi-fi-sm flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                      {evt.category}
                    </span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      RSVP Confirmed
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">{evt.title}</h4>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    {evt.date} · {evt.time}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{evt.location}</p>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <button
                    onClick={() => openModal('event-detail', evt)}
                    className="text-zinc-300 hover:text-white font-bold"
                  >
                    Event Details
                  </button>
                  <span className="text-emerald-400 font-extrabold text-[11px]">
                    Synced in Planner ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. My Study Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-violet-400" />
            <span>My Study Cohorts ({myStudyGroups.length})</span>
          </h3>
          <button
            onClick={() => onNavigateCategory('study-groups')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            All Study Groups &rarr;
          </button>
        </div>

        {myStudyGroups.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#13141F] border border-white/[0.08] text-center text-xs text-zinc-400">
            You haven't joined a study group yet.{' '}
            <button
              onClick={() => onNavigateCategory('study-groups')}
              className="text-indigo-400 font-bold hover:underline"
            >
              Browse active cohorts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {myStudyGroups.map((grp) => (
              <div
                key={grp.id}
                className="ios-liquid-card p-4 card-soft-hover shadow-hi-fi-sm flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                      {grp.courseCode}
                    </span>
                    <span className="text-zinc-400 font-semibold">
                      {grp.membersCount} peers enrolled
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">{grp.name}</h4>
                  <p className="text-xs text-zinc-300 font-medium">Topic: {grp.topic}</p>
                  <p className="text-[11px] text-zinc-500">{grp.schedule} · {grp.location}</p>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-extrabold text-[11px]">Enrolled Member</span>
                  <button
                    onClick={() => onNavigateCategory('study-groups')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] transition-colors"
                  >
                    View Cohort &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Active Challenges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>Active Challenges ({myChallenges.length})</span>
          </h3>
          <button
            onClick={() => onNavigateCategory('challenges')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            All Challenges &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {myChallenges.map((ch) => (
            <div
              key={ch.id}
              className="ios-liquid-card p-4 card-soft-hover shadow-hi-fi-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                    {ch.category}
                  </span>
                  <span className="font-extrabold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400" /> +{ch.xpReward} XP
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{ch.title}</h4>
                <p className="text-xs text-zinc-400">{ch.description}</p>

                <div className="space-y-1 pt-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-300">
                    <span>Sprint Progress</span>
                    <span>{ch.progressPercent || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181926] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${ch.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[10px] text-zinc-400 font-bold">{ch.deadline}</span>
                <span className="text-emerald-400 font-bold text-[11px]">Advancing Active Recall</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
