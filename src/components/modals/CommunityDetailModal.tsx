import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Users,
  MessageSquare,
  Plus,
  Check,
  FileText,
  Download,
  ThumbsUp,
  Send,
} from 'lucide-react';
import { CampusCommunity } from '../../types';

export const CommunityDetailModal: React.FC = () => {
  const { modalData, closeModal, toggleJoinCommunity, openModal, triggerCelebration } = useApp();
  const community = modalData as CampusCommunity;

  const [activeTab, setActiveTab] = useState<'discussions' | 'files' | 'members'>('discussions');
  const [newReply, setNewReply] = useState('');
  const [threads, setThreads] = useState([
    {
      id: 'th-1',
      author: community?.recentPostAuthor || 'Nalubega Sarah',
      time: community?.recentPostTime || '25m ago',
      content: community?.recentPostSnippet || 'Which approach is recommended for the final coursework submission?',
      upvotes: 14,
      hasUpvoted: false,
      repliesCount: 4,
    },
    {
      id: 'th-2',
      author: 'Otim Denis',
      time: '2h ago',
      content: 'Does anyone have the past exam paper solutions for the 2024 November sitting? Question 3 was tricky.',
      upvotes: 21,
      hasUpvoted: true,
      repliesCount: 7,
    },
  ]);

  if (!community) return null;

  const communityFiles = [
    {
      name: `${community.courseCode || 'CS'} Lecture 1-6 Exam High-Yield Summary.pdf`,
      size: '2.4 MB',
      author: 'Rita K. (Guild Academic Rep)',
      date: 'Uploaded 2 days ago',
      downloads: 78,
    },
    {
      name: `${community.courseCode || 'Course'} Midterm Past Papers & Answer Keys (2022-2025).pdf`,
      size: '5.1 MB',
      author: 'Denis O.',
      date: 'Uploaded yesterday',
      downloads: 142,
    },
    {
      name: 'Lab Workstation Exercise 4 Starter Template.zip',
      size: '1.2 MB',
      author: 'TA Robert',
      date: 'Uploaded 3 days ago',
      downloads: 65,
    },
  ];

  const classmates = [
    { name: 'Nalubega Sarah', role: 'Class Rep & Peer Tutor', online: true },
    { name: 'Otim Denis', role: 'Study Group Lead', online: true },
    { name: 'Mbabazi Brian', role: 'Enrolled Peer', online: false },
    { name: 'Rita Kigozi', role: 'Academic Committe', online: true },
    { name: 'Patrick Mugisha', role: 'Hackathon Partner', online: false },
  ];

  const handleAddThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setThreads([
      {
        id: `th-${Date.now()}`,
        author: 'Kato Samuel (You)',
        time: 'Just now',
        content: newReply.trim(),
        upvotes: 1,
        hasUpvoted: true,
        repliesCount: 0,
      },
      ...threads,
    ]);
    setNewReply('');
    triggerCelebration();
  };

  const handleUpvoteThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const nextUpvoted = !t.hasUpvoted;
        return {
          ...t,
          hasUpvoted: nextUpvoted,
          upvotes: nextUpvoted ? t.upvotes + 1 : t.upvotes - 1,
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#13141D] border border-white/[0.1] w-full max-w-lg p-6 shadow-2xl space-y-4 rounded-3xl text-white modal-sheet-dynamic overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0"
              style={{ backgroundColor: community.avatarColor }}
            >
              {community.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] py-0.5 px-2 rounded-full font-bold uppercase">
                {community.category}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                {community.name}
              </h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-2xl bg-[#090A0E] border border-white/[0.06] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('discussions')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'discussions'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions ({threads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'files'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Peer Notes ({communityFiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Classmates ({community.memberCount})</span>
          </button>
        </div>

        {/* TAB 1: DISCUSSIONS */}
        {activeTab === 'discussions' && (
          <div className="space-y-3.5 text-xs">
            {/* Start a Discussion Input */}
            <form onSubmit={handleAddThread} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder={`Post a question or thought to ${community.name.split(' ')[0]}...`}
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-xs font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  type="submit"
                  disabled={!newReply.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white hover:bg-zinc-100 text-black px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1 disabled:opacity-50 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Threads List */}
            <div className="space-y-2.5">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-bold text-zinc-200">{t.author}</span>
                    <span>{t.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-300 leading-relaxed">
                    "{t.content}"
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] text-[11px]">
                    <button
                      onClick={() => handleUpvoteThread(t.id)}
                      className={`flex items-center gap-1 font-bold ${
                        t.hasUpvoted ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{t.upvotes}</span>
                    </button>
                    <span className="text-zinc-400 font-medium">
                      {t.repliesCount} replies
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PEER FILES & NOTES */}
        {activeTab === 'files' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-zinc-400 font-medium">
              Shared study notes, exam summaries, and code templates from peers in this cohort.
            </p>

            <div className="space-y-2">
              {communityFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-xs">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {file.size} · by {file.author}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerCelebration()}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-colors shrink-0"
                    title="Download Note"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLASSMATES & STUDY PARTNERS */}
        {activeTab === 'members' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-zinc-400 font-medium">
              Enrolled students in this community cohort.
            </p>

            <div className="space-y-2">
              {classmates.map((member, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center font-bold text-zinc-200">
                      {member.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{member.name}</span>
                        {member.online && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active on Campus" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">{member.role}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      closeModal();
                      openModal('create-study-group');
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:underline"
                  >
                    + Study Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => toggleJoinCommunity(community.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              community.isJoined
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white hover:bg-zinc-100 text-black'
            }`}
          >
            {community.isJoined ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Joined Community</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Join Community</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
