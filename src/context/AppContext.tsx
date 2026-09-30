import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  TabType,
  StudentProfile,
  Course,
  ScheduleEvent,
  PriorityItem,
  StudyRecommendation,
  Announcement,
  FlashcardDeck,
  Quiz,
  StudyMaterial,
  StudyGroup,
  CampusOpportunity,
  MarketplaceItem,
  CampusService,
  AcademicConnection,
  NotificationItem,
  FlowConsequence,
  CampusCommunity,
  CampusEvent,
  CampusQuestion,
  CampusPulsePoll,
  ForYouFeedItem,
  CampusChallenge,
  FeeSummary,
  SupportedUniversity,
} from '../types';
import {
  supabase,
  fetchCloudUserData,
  persistAcademicData,
  persistStudyMaterial,
  signOutUser,
  isSupabaseConfigured,
} from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import {
  INITIAL_STUDENT_PROFILE,
  INITIAL_COURSES,
  INITIAL_SCHEDULE_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  getUniversityAnnouncements,
  FLASHCARD_DECKS,
  PRACTICE_QUIZZES,
  STUDY_MATERIALS,
  getUniversityStudyMaterials,
  STUDY_GROUPS,
  getUniversityStudyGroups,
  CAMPUS_OPPORTUNITIES,
  getUniversityCampusOpportunities,
  MARKETPLACE_ITEMS,
  getUniversityMarketplaceItems,
  CAMPUS_SERVICES,
  getUniversityCampusServices,
  ACADEMIC_CONNECTIONS,
  getUniversityAcademicConnections,
  INITIAL_NOTIFICATIONS,
  CAMPUS_COMMUNITIES,
  getUniversityCampusCommunities,
  CAMPUS_EVENTS,
  getUniversityCampusEvents,
  CAMPUS_QUESTIONS,
  getUniversityCampusQuestions,
  CAMPUS_PULSE_POLL,
  getUniversityCampusPulse,
  FOR_YOU_FEED_ITEMS,
  getUniversityForYouFeedItems,
  CAMPUS_CHALLENGES,
  getUniversityCampusChallenges,
  getUniversityCampusVenues,
  UNIVERSITY_PRESETS,
} from '../data/mockData';

export type ModalType =
  | 'add-task'
  | 'add-event'
  | 'focus-session'
  | 'assignment-detail'
  | 'exam-conflict'
  | 'course-detail'
  | 'material-viewer'
  | 'study-group-detail'
  | 'opportunity-detail'
  | 'marketplace-detail'
  | 'campus-service-detail'
  | 'source-connect'
  | 'notifications'
  | 'flow-trace'
  | 'ai-assistant'
  | 'onboarding'
  | 'create-study-group'
  | 'ask-question'
  | 'event-detail'
  | 'community-detail'
  | null;

export type ViewportMode = 'responsive' | 'mobile-mockup' | 'tablet-mockup';
export type AppSimulationState = 'normal' | 'empty' | 'loading' | 'error';

interface AppContextValue {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  student: StudentProfile;
  updateStudent: (partial: Partial<StudentProfile>) => void;
  courses: Course[];
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  events: ScheduleEvent[];
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => ScheduleEvent;
  toggleEventCompleted: (id: string) => void;
  deleteEvent: (id: string) => void;
  priorities: PriorityItem[];
  togglePriorityCompleted: (id: string) => void;
  addPriority: (item: Omit<PriorityItem, 'id'>) => void;
  studyRecommendation: StudyRecommendation;
  announcements: Announcement[];
  markAnnouncementRead: (id: string) => void;
  flashcardDecks: FlashcardDeck[];
  toggleCardMastered: (deckId: string, cardId: string) => void;
  addFlashcardDeck: (deck: FlashcardDeck) => void;
  quizzes: Quiz[];
  addQuiz: (quiz: Quiz) => void;
  studyMaterials: StudyMaterial[];
  studyGroups: StudyGroup[];
  toggleJoinStudyGroup: (id: string) => void;
  addStudyGroup: (grp: Omit<StudyGroup, 'id' | 'membersCount' | 'isMember'>) => void;
  addStudySessionToPlanner: (grp: StudyGroup) => void;
  opportunities: CampusOpportunity[];
  marketplaceItems: MarketplaceItem[];
  campusServices: CampusService[];
  connections: AcademicConnection[];
  triggerConnectionSync: (id: string) => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markAllNotificationsRead: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  activeModal: ModalType;
  modalData: any;
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  triggerCelebration: () => void;
  simulationState: AppSimulationState;
  setSimulationState: (state: AppSimulationState) => void;
  logStudyTime: (minutes: number, courseCode?: string) => void;
  activeFlowConsequence: FlowConsequence | null;
  clearFlowConsequence: () => void;
  // Campus Hub Ecosystem
  campusCommunities: CampusCommunity[];
  toggleJoinCommunity: (id: string) => void;
  campusEvents: CampusEvent[];
  toggleRsvpEvent: (id: string) => void;
  toggleSaveEvent: (id: string) => void;
  addCampusEventToPlanner: (event: CampusEvent) => void;
  campusQuestions: CampusQuestion[];
  toggleUpvoteQuestion: (id: string) => void;
  addQuestion: (q: { title: string; body: string; courseCode: string }) => void;
  campusPulse: CampusPulsePoll;
  voteCampusPulse: (optionId: string) => void;
  forYouFeedItems: ForYouFeedItem[];
  campusChallenges: CampusChallenge[];
  toggleJoinChallenge: (id: string) => void;
  // Multi-University Abstraction & Portal Bridge
  selectedUniversity: SupportedUniversity;
  setSelectedUniversity: (uni: SupportedUniversity) => void;
  loadUniversitySnapshot: (uni: SupportedUniversity) => void;
  isPortalSynced: boolean;
  feeSummary: FeeSummary | null;
  syncPortalData: (payload: any, universityName?: SupportedUniversity) => void;
  // Dedicated Onboarding Flow
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  resetOnboarding: () => void;
  completeOnboarding: (data?: { university?: SupportedUniversity; studentName?: string; email?: string }) => void;
  // Supabase Cloud Authentication & Sync Engine
  authSession: Session | null;
  currentUser: User | null;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  signOut: () => Promise<void>;
  isSupabaseConnected: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Helper to calculate dynamic urgency text
function formatUrgencyText(dateStr: string, timeStr: string): string {
  if (dateStr === '2026-09-29') {
    return `Due today · ${timeStr}`;
  }
  if (dateStr === '2026-09-30') {
    return `Due tomorrow · ${timeStr}`;
  }
  if (dateStr === '2026-10-01') {
    return `In 2 days · ${timeStr}`;
  }
  if (dateStr === '2026-10-02') {
    return `Friday · ${timeStr}`;
  }
  return `Due ${dateStr.slice(5)} · ${timeStr}`;
}

// Helper to compute smart study recommendation dynamically from events & courses
function computeSmartStudyRecommendation(
  events: ScheduleEvent[],
  courses: Course[]
): StudyRecommendation {
  // Find all pending assignments, tests, and exams
  const pendingAssessments = events
    .filter(
      (e) =>
        !e.completed &&
        (e.type === 'assignment' || e.type === 'test' || e.type === 'exam')
    )
    .sort((a, b) => {
      // Sort by date, then by time
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });

  if (pendingAssessments.length > 0) {
    const nextUrgent = pendingAssessments[0];
    const course = courses.find((c) => c.code === nextUrgent.courseCode);
    const urgency = formatUrgencyText(nextUrgent.date, nextUrgent.startTime);

    return {
      courseCode: nextUrgent.courseCode,
      courseName: course?.name || nextUrgent.courseName || nextUrgent.courseCode,
      topic: `${nextUrgent.title} Focus & Prep`,
      availableMinutes: 45,
      activeRecallMinutes: 20,
      practiceMinutes: 25,
      reason: `Prioritized dynamically: ${nextUrgent.title} is ${urgency}. A 45m session now prevents cramming.`,
      difficulty: 'High-yield',
    };
  }

  // Fallback if all assessments are completed - dynamic from courses[0]
  const fallbackCourse = courses[0];
  return {
    courseCode: fallbackCourse?.code || 'HEC1207',
    courseName: fallbackCourse?.name || 'Fundamentals of Business & Management',
    topic: `${fallbackCourse?.name || 'Academic Core'} Comprehensive Review`,
    availableMinutes: 30,
    activeRecallMinutes: 15,
    practiceMinutes: 15,
    reason: 'All immediate deadlines are caught up! Reinforcing core unit competencies for upcoming evaluations.',
    difficulty: 'Medium',
  };
}

export function createSyncedFlashcardDecks(coursesList: Course[]): FlashcardDeck[] {
  const c0 = coursesList[0];
  const c1 = coursesList[1];
  const c3 = coursesList[3];
  const c4 = coursesList[4];

  return [
    {
      id: `deck-${c0?.code.toLowerCase() || 'hec1207'}`,
      courseCode: c0?.code || 'HEC1207',
      courseName: c0?.name || 'Fundamentals of Business & Management',
      title: 'Core Management Functions & Planning Invariants',
      cards: [
        {
          id: 'fc-1',
          front: 'What are the 4 fundamental functions of management?',
          back: '1. Planning (defining goals and actions)\n2. Organizing (allocating resources and structure)\n3. Leading (motivating and directing personnel)\n4. Controlling (monitoring performance and correcting deviations).',
          hint: 'POLC Framework',
          mastered: true,
        },
        {
          id: 'fc-2',
          front: 'Distinguish between Strategic, Tactical, and Operational planning.',
          back: 'Strategic: Long-term (3-5 years) top-management vision.\nTactical: Medium-term (1 year) departmental execution plans.\nOperational: Short-term daily/weekly schedules and task checklists.',
          hint: 'Think about organizational hierarchy and time horizons.',
          mastered: false,
        },
        {
          id: 'fc-3',
          front: 'What is the primary difference between formal and informal organizational structures?',
          back: 'Formal structures are officially codified through organizational charts, official reporting hierarchies, and assigned responsibilities. Informal structures arise organically through spontaneous social interactions, peer networks, and shared interests.',
          hint: 'Codified hierarchy vs social networks.',
          mastered: false,
        },
      ],
    },
    {
      id: `deck-${c1?.code.toLowerCase() || 'hec1208'}`,
      courseCode: c1?.code || 'HEC1208',
      courseName: c1?.name || 'Foundational Statistics',
      title: 'Measures of Dispersion & Probability Distributions',
      cards: [
        {
          id: 'fc-4',
          front: 'What is the relationship between Variance and Standard Deviation?',
          back: 'Standard Deviation is the positive square root of Variance (sigma = sqrt(sigma^2)). It measures dispersion in the same units as the original dataset.',
          hint: 'Square root relationship.',
          mastered: true,
        },
        {
          id: 'fc-5',
          front: 'State the Empirical Rule (68-95-99.7 rule) for normal distributions.',
          back: 'In a normal distribution:\n- ~68% of data falls within 1 standard deviation of the mean.\n- ~95% falls within 2 standard deviations.\n- ~99.7% falls within 3 standard deviations.',
          hint: 'Three standard deviation benchmarks.',
          mastered: false,
        },
      ],
    },
    ...(c3
      ? [
          {
            id: `deck-${c3.code.toLowerCase()}`,
            courseCode: c3.code,
            courseName: c3.name,
            title: 'Algorithm Control Structures & Flowchart Traceability',
            cards: [
              {
                id: 'fc-6',
                front: 'What are the three fundamental algorithmic control structures?',
                back: '1. Sequence (linear step-by-step execution)\n2. Selection / Condition (if-else, switch branching)\n3. Iteration / Repetition (for, while loops).',
                hint: 'Böhm-Jacopini theorem building blocks.',
                mastered: true,
              },
              {
                id: 'fc-7',
                front: 'What is a trace table used for in algorithm verification?',
                back: 'A trace table is a testing technique used to step through algorithm instructions manually, tracking variable values at each step to detect logic errors or infinite loops.',
                hint: 'Dry-run manual execution.',
                mastered: false,
              },
            ],
          },
        ]
      : []),
    ...(c4
      ? [
          {
            id: `deck-${c4.code.toLowerCase()}`,
            courseCode: c4.code,
            courseName: c4.name,
            title: 'Relational Schema, DDL & Query Filtering',
            cards: [
              {
                id: 'fc-8',
                front: 'What is the difference between DDL and DML in SQL?',
                back: 'DDL (Data Definition Language) defines/modifies database structures (CREATE, ALTER, DROP).\nDML (Data Manipulation Language) queries and modifies table data (SELECT, INSERT, UPDATE, DELETE).',
                hint: 'Schema definition vs data manipulation.',
                mastered: true,
              },
              {
                id: 'fc-9',
                front: 'Explain the difference between WHERE and HAVING clauses in SQL.',
                back: 'WHERE filters rows before aggregation occurs.\nHAVING filters group results after the GROUP BY aggregation has been calculated.',
                hint: 'Pre-aggregation vs post-aggregation filtering.',
                mastered: false,
              },
            ],
          },
        ]
      : []),
  ];
}

export function createSyncedQuizzes(coursesList: Course[]): Quiz[] {
  const c0 = coursesList[0];
  const c1 = coursesList[1];

  return [
    {
      id: `quiz-${c0?.code.toLowerCase() || 'hec1207'}`,
      courseCode: c0?.code || 'HEC1207',
      title: `${c0?.code || 'HEC1207'}: Business Management Foundations Assessment`,
      estimatedMinutes: 6,
      questions: [
        {
          id: 'q-hec-1',
          question: 'Which management function involves establishing organizational goals and determining how best to achieve them?',
          options: ['Controlling', 'Planning', 'Organizing', 'Leading'],
          correctIndex: 1,
          explanation: 'Planning is the forward-looking function that establishes mission, goals, strategy, and operational schedules.',
        },
        {
          id: 'q-hec-2',
          question: 'What does the acronym SMART stand for in goal-setting theory?',
          options: [
            'Specific, Measurable, Achievable, Relevant, Time-bound',
            'Strategic, Meaningful, Actionable, Resilient, Tested',
            'Systematic, Managed, Aligned, Robust, Targeted',
            'Standard, Monitored, Audited, Reported, Tracked',
          ],
          correctIndex: 0,
          explanation: 'SMART goals must be Specific, Measurable, Achievable, Relevant, and Time-bound.',
        },
      ],
    },
    {
      id: `quiz-${c1?.code.toLowerCase() || 'hec1208'}`,
      courseCode: c1?.code || 'HEC1208',
      title: `${c1?.code || 'HEC1208'}: Statistics Probability Drill`,
      estimatedMinutes: 5,
      questions: [
        {
          id: 'q-stat-1',
          question: 'What is the sum of probabilities for all mutually exclusive and exhaustive events in a sample space?',
          options: ['0', '0.5', '1.0', 'Infinity'],
          correctIndex: 2,
          explanation: 'By the axioms of probability, the sum of probabilities of all mutually exclusive events in a sample space equals 1.0.',
        },
      ],
    },
  ];
}

export function createSyncedStudyGroups(coursesList: Course[], adminName: string): StudyGroup[] {
  return coursesList.slice(0, 3).map((c, i) => ({
    id: `sg-${c.code.toLowerCase()}`,
    courseCode: c.code,
    name: `${c.code} Academic Study Squad`,
    membersCount: 4 + i,
    maxMembers: 8,
    schedule: i === 0 ? 'Tuesdays & Thursdays · 17:00' : 'Wednesdays · 15:30',
    location: 'Main Campus · Collaborative Pod',
    topic: `${c.name} - Applied Case Studies & Problem Sets`,
    isMember: i === 0,
    adminName: adminName || 'Samuel',
  }));
}

export function createSyncedCampusQuestions(coursesList: Course[]): CampusQuestion[] {
  return coursesList.slice(0, 3).map((c, i) => ({
    id: `q-sync-${c.code.toLowerCase()}`,
    title: `Clarification on ${c.code} coursework submission guidelines`,
    body: `Are we required to submit the assignment printed copy to the departmental office or solely through the official LMS portal for ${c.name}?`,
    courseCode: c.code,
    courseName: c.name,
    authorName: 'Mbabazi Brian',
    authorYear: 'Year 1 CS',
    timeAgo: `${i * 2 + 1}h ago`,
    answersCount: 5,
    upvotesCount: 18,
    isAnswered: true,
    hasUpvoted: true,
    topAnswerAuthor: 'Faculty Course Coordinator',
    topAnswerSnippet: `All coursework for ${c.code} should be uploaded directly to the university portal before the cutoff. No physical copy is required.`,
    tags: [c.code, 'Coursework', 'LMS'],
  }));
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');

  const [selectedUniversity, setSelectedUniversityState] = useState<SupportedUniversity>(() => {
    const saved = localStorage.getItem('coursemate_university');
    if (
      saved &&
      (saved === 'ISBAT University' ||
        saved === 'Makerere University' ||
        saved === 'Kyambogo University' ||
        saved === 'MUBS')
    ) {
      return saved as SupportedUniversity;
    }
    return 'ISBAT University';
  });



  // Dedicated Onboarding State
  const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => {
    return localStorage.getItem('coursemate_onboarded') === 'true';
  });

  const setIsOnboarded = (val: boolean) => {
    setIsOnboardedState(val);
    if (val) {
      localStorage.setItem('coursemate_onboarded', 'true');
    } else {
      localStorage.removeItem('coursemate_onboarded');
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem('coursemate_onboarded');
    setIsOnboardedState(false);
  };

  const completeOnboarding = (data?: { university?: SupportedUniversity; studentName?: string; email?: string }) => {
    if (data?.university) {
      setSelectedUniversity(data.university);
    }
    if (data?.studentName) {
      setStudent((prev) => ({
        ...prev,
        name: data.studentName!,
        preferredName: data.studentName!.split(' ')[0],
      }));
    }
    localStorage.setItem('coursemate_onboarded', 'true');
    setIsOnboardedState(true);
  };

  const [isPortalSynced, setIsPortalSynced] = useState<boolean>(() => {
    return localStorage.getItem('coursemate_portal_synced') === 'true';
  });

  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(() => {
    const saved = localStorage.getItem('coursemate_fee_summary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [student, setStudent] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('coursemate_student');
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          university: isSyncedStored ? (parsed.university || selectedUniversity) : selectedUniversity,
          isSynced: isSyncedStored,
        };
      } catch {}
    }
    return {
      ...INITIAL_STUDENT_PROFILE,
      university: selectedUniversity,
      isSynced: isSyncedStored,
    };
  });

  const [rawCourses, setRawCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('coursemate_courses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_COURSES;
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    const savedCoursesStr = localStorage.getItem('coursemate_courses');
    const saved = localStorage.getItem('coursemate_events');
    if (saved) {
      try {
        const parsed: ScheduleEvent[] = JSON.parse(saved);
        if (isSyncedStored && savedCoursesStr) {
          const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
          const validCodes = new Set(parsedCourses.map((c) => c.code.toUpperCase()));
          return parsed.filter((e) => !e.courseCode || validCodes.has(e.courseCode.toUpperCase()));
        }
        return parsed;
      } catch {}
    }
    return INITIAL_SCHEDULE_EVENTS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    getUniversityAnnouncements(selectedUniversity)
  );
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(() => {
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    const savedCoursesStr = localStorage.getItem('coursemate_courses');
    const saved = localStorage.getItem('coursemate_flashcards');
    if (saved) {
      try {
        const parsed: FlashcardDeck[] = JSON.parse(saved);
        if (isSyncedStored && savedCoursesStr) {
          const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
          const validCodes = new Set(parsedCourses.map((c) => c.code.toUpperCase()));
          const filtered = parsed.filter((d) => validCodes.has(d.courseCode.toUpperCase()));
          if (filtered.length > 0) return filtered;
          return createSyncedFlashcardDecks(parsedCourses);
        }
        return parsed;
      } catch {}
    }
    if (isSyncedStored && savedCoursesStr) {
      try {
        const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
        return createSyncedFlashcardDecks(parsedCourses);
      } catch {}
    }
    return FLASHCARD_DECKS;
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    const savedCoursesStr = localStorage.getItem('coursemate_courses');
    if (isSyncedStored && savedCoursesStr) {
      try {
        const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
        return createSyncedQuizzes(parsedCourses);
      } catch {}
    }
    return PRACTICE_QUIZZES;
  });
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() =>
    getUniversityStudyMaterials(selectedUniversity)
  );
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => {
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    const savedCoursesStr = localStorage.getItem('coursemate_courses');
    if (isSyncedStored && savedCoursesStr) {
      try {
        const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
        return createSyncedStudyGroups(parsedCourses, 'Samuel');
      } catch {}
    }
    return getUniversityStudyGroups(selectedUniversity, 'Samuel');
  });
  const [opportunities, setOpportunities] = useState<CampusOpportunity[]>(() =>
    getUniversityCampusOpportunities(selectedUniversity)
  );
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() =>
    getUniversityMarketplaceItems(selectedUniversity)
  );
  const [campusServices, setCampusServices] = useState<CampusService[]>(() =>
    getUniversityCampusServices(selectedUniversity)
  );
  const [connections, setConnections] = useState<AcademicConnection[]>(() => {
    const saved = localStorage.getItem('coursemate_connections');
    if (saved) {
      try {
        const parsed: AcademicConnection[] = JSON.parse(saved);
        // Sanitize any stale 'Makerere ISMIS' artifact from previous local storage
        const hasStaleMakerere = parsed.some(
          (c) =>
            c.name.includes('Makerere ISMIS') ||
            (selectedUniversity === 'ISBAT University' && c.name.toLowerCase().includes('makerere'))
        );
        if (!hasStaleMakerere && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return getUniversityAcademicConnections(selectedUniversity, isPortalSynced);
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Campus Hub State
  const [campusCommunities, setCampusCommunities] = useState<CampusCommunity[]>(() =>
    getUniversityCampusCommunities(selectedUniversity)
  );
  const [campusEvents, setCampusEvents] = useState<CampusEvent[]>(() =>
    getUniversityCampusEvents(selectedUniversity)
  );
  const [campusQuestions, setCampusQuestions] = useState<CampusQuestion[]>(() => {
    const isSyncedStored = localStorage.getItem('coursemate_portal_synced') === 'true';
    const savedCoursesStr = localStorage.getItem('coursemate_courses');
    if (isSyncedStored && savedCoursesStr) {
      try {
        const parsedCourses: Course[] = JSON.parse(savedCoursesStr);
        return createSyncedCampusQuestions(parsedCourses);
      } catch {}
    }
    return getUniversityCampusQuestions(selectedUniversity);
  });
  const [campusPulse, setCampusPulse] = useState<CampusPulsePoll>(() =>
    getUniversityCampusPulse(selectedUniversity)
  );
  const [forYouFeedItems, setForYouFeedItems] = useState<ForYouFeedItem[]>(() =>
    getUniversityForYouFeedItems(selectedUniversity)
  );
  const [campusChallenges, setCampusChallenges] = useState<CampusChallenge[]>(() =>
    getUniversityCampusChallenges(selectedUniversity)
  );

  // ----------------------------------------------------
  // Supabase Auth & Cloud Database Hydration on Mount
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session) {
          setAuthSession(session);
          setCurrentUser(session.user);
          setCloudSyncStatus('syncing');

          console.log('[CourseMate Cloud] Active Supabase session detected. Hydrating user state...');
          const cloudData = await fetchCloudUserData(session.access_token);
          if (!isMounted) return;

          if (cloudData && cloudData.status === 'success') {
            if (cloudData.profile?.selectedUniversity) {
              setSelectedUniversityState(cloudData.profile.selectedUniversity);
              localStorage.setItem('coursemate_university', cloudData.profile.selectedUniversity);
            }
            if (cloudData.student) {
              setStudent(cloudData.student);
              localStorage.setItem('coursemate_student', JSON.stringify(cloudData.student));
            }
            if (cloudData.courses && cloudData.courses.length > 0) {
              setRawCourses(cloudData.courses);
              localStorage.setItem('coursemate_courses', JSON.stringify(cloudData.courses));
            }
            if (cloudData.events && cloudData.events.length > 0) {
              setEvents(cloudData.events);
              localStorage.setItem('coursemate_events', JSON.stringify(cloudData.events));
            }
            if (cloudData.flashcardDecks && cloudData.flashcardDecks.length > 0) {
              setFlashcardDecks(cloudData.flashcardDecks);
              localStorage.setItem('coursemate_flashcards', JSON.stringify(cloudData.flashcardDecks));
            }
            if (cloudData.feeSummary) {
              setFeeSummary(cloudData.feeSummary);
              localStorage.setItem('coursemate_fee_summary', JSON.stringify(cloudData.feeSummary));
            }
            setIsPortalSynced(true);
            setIsOnboardedState(true);
            setCloudSyncStatus('synced');
            console.log('[CourseMate Cloud] State successfully hydrated from Supabase PostgreSQL.');
          } else {
            setCloudSyncStatus('idle');
          }
        } else {
          setCloudSyncStatus('offline');
        }
      } catch (err: any) {
        console.warn('[CourseMate Cloud] Session initialization notice:', err.message);
        setCloudSyncStatus('offline');
      }
    }

    initSupabaseSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setAuthSession(session);
      setCurrentUser(session ? session.user : null);

      if (session) {
        setCloudSyncStatus('syncing');
        const cloudData = await fetchCloudUserData(session.access_token);
        if (cloudData && cloudData.status === 'success') {
          if (cloudData.profile?.selectedUniversity) {
            setSelectedUniversityState(cloudData.profile.selectedUniversity);
            localStorage.setItem('coursemate_university', cloudData.profile.selectedUniversity);
          }
          if (cloudData.student) {
            setStudent(cloudData.student);
            localStorage.setItem('coursemate_student', JSON.stringify(cloudData.student));
          }
          if (cloudData.courses && cloudData.courses.length > 0) {
            setRawCourses(cloudData.courses);
            localStorage.setItem('coursemate_courses', JSON.stringify(cloudData.courses));
          }
          if (cloudData.events && cloudData.events.length > 0) {
            setEvents(cloudData.events);
            localStorage.setItem('coursemate_events', JSON.stringify(cloudData.events));
          }
          if (cloudData.flashcardDecks && cloudData.flashcardDecks.length > 0) {
            setFlashcardDecks(cloudData.flashcardDecks);
            localStorage.setItem('coursemate_flashcards', JSON.stringify(cloudData.flashcardDecks));
          }
          if (cloudData.feeSummary) {
            setFeeSummary(cloudData.feeSummary);
            localStorage.setItem('coursemate_fee_summary', JSON.stringify(cloudData.feeSummary));
          }
          setIsPortalSynced(true);
          setIsOnboardedState(true);
          setCloudSyncStatus('synced');
        }
      } else {
        setCloudSyncStatus('offline');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setAuthSession(null);
    setCurrentUser(null);
    setCloudSyncStatus('offline');
  };

  const setSelectedUniversity = (uni: SupportedUniversity) => {
    setSelectedUniversityState(uni);
    localStorage.setItem('coursemate_university', uni);

    setStudent((prev) => {
      const updated = { ...prev, university: uni };
      localStorage.setItem('coursemate_student', JSON.stringify(updated));
      return updated;
    });

    const newConns = getUniversityAcademicConnections(uni, isPortalSynced);
    setConnections(newConns);
    localStorage.setItem('coursemate_connections', JSON.stringify(newConns));

    // Enforce instant institutional partitioning across all campus domains
    setAnnouncements(getUniversityAnnouncements(uni));
    setCampusEvents(getUniversityCampusEvents(uni));
    setCampusCommunities(getUniversityCampusCommunities(uni));
    setStudyMaterials(getUniversityStudyMaterials(uni));
    setOpportunities(getUniversityCampusOpportunities(uni));
    setMarketplaceItems(getUniversityMarketplaceItems(uni));
    setCampusServices(getUniversityCampusServices(uni));
    setCampusPulse(getUniversityCampusPulse(uni));
    setForYouFeedItems(getUniversityForYouFeedItems(uni));
    setCampusChallenges(getUniversityCampusChallenges(uni));

    if (!isPortalSynced) {
      setStudyGroups(getUniversityStudyGroups(uni, student.name));
      setCampusQuestions(getUniversityCampusQuestions(uni));
    }
  };

  // Dynamic flow trace consequence banner
  const [activeFlowConsequence, setActiveFlowConsequence] = useState<FlowConsequence | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('coursemate_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  // Sync theme with root document element class for dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('coursemate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [simulationState, setSimulationState] = useState<AppSimulationState>('normal');

  // Dynamically compute Course metrics (upcomingAssignments & upcomingTests) based on live events
  const courses = useMemo(() => {
    return rawCourses.map((course) => {
      const pendingAssignments = events.filter(
        (e) =>
          e.courseCode === course.code &&
          e.type === 'assignment' &&
          !e.completed
      ).length;

      const pendingTests = events.filter(
        (e) =>
          e.courseCode === course.code &&
          (e.type === 'test' || e.type === 'exam') &&
          !e.completed
      ).length;

      const totalCourseEvents = events.filter((e) => e.courseCode === course.code);
      const completedCount = totalCourseEvents.filter((e) => e.completed).length;
      const calculatedPct =
        totalCourseEvents.length > 0
          ? Math.round((completedCount / totalCourseEvents.length) * 100)
          : course.progressPct;

      return {
        ...course,
        upcomingAssignments: pendingAssignments,
        upcomingTests: pendingTests,
        progressPct: Math.min(100, Math.max(course.progressPct, calculatedPct)),
      };
    });
  }, [rawCourses, events]);

  // Dynamically compute Priorities list from active events
  const priorities = useMemo(() => {
    const list: PriorityItem[] = events
      .filter((e) => !e.completed && (e.type === 'assignment' || e.type === 'test' || e.type === 'exam' || e.type === 'study_session'))
      .map((e) => ({
        id: `priority-${e.id}`,
        title: e.title,
        courseCode: e.courseCode,
        urgencyText: formatUrgencyText(e.date, e.startTime),
        dueTime: e.date,
        type: e.type === 'assignment' ? 'assignment' : e.type === 'study_session' ? 'study' : 'test',
        completed: !!e.completed,
      }));

    // Sort by due date
    return list.sort((a, b) => a.dueTime.localeCompare(b.dueTime));
  }, [events]);

  // Dynamically compute smart study recommendation from events & courses
  const studyRecommendation = useMemo(() => {
    return computeSmartStudyRecommendation(events, courses);
  }, [events, courses]);

  useEffect(() => {
    localStorage.setItem('coursemate_student', JSON.stringify(student));
  }, [student]);

  useEffect(() => {
    localStorage.setItem('coursemate_courses', JSON.stringify(rawCourses));
  }, [rawCourses]);

  useEffect(() => {
    localStorage.setItem('coursemate_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('coursemate_flashcards', JSON.stringify(flashcardDecks));
    localStorage.setItem('coursemate_flashcard_decks', JSON.stringify(flashcardDecks));
  }, [flashcardDecks]);

  useEffect(() => {
    if (feeSummary) {
      localStorage.setItem('coursemate_fee_summary', JSON.stringify(feeSummary));
    }
  }, [feeSummary]);

  useEffect(() => {
    localStorage.setItem('coursemate_portal_synced', isPortalSynced ? 'true' : 'false');
  }, [isPortalSynced]);

  const updateStudent = (partial: Partial<StudentProfile>) => {
    setStudent((prev) => ({ ...prev, ...partial }));
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981'],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  // Toggle completion of an event (and synchronously update all dependent screens)
  const toggleEventCompleted = (id: string) => {
    let targetEvent: ScheduleEvent | undefined;

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          targetEvent = e;
          const nextCompleted = !e.completed;
          if (nextCompleted) {
            triggerCelebration();

            // Generate completion notification
            const compNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              title: `Task Completed: ${e.title}`,
              body: `Marked done in Planner, Home priorities, and ${e.courseCode} assessment record.`,
              timeAgo: 'Just now',
              type: 'deadline',
              unread: true,
              actionableId: e.id,
            };
            setNotifications((n) => [compNotif, ...n]);
          }
          return { ...e, completed: nextCompleted };
        }
        return e;
      })
    );
  };

  // Synchronous priority toggle (maps directly to underlying event)
  const togglePriorityCompleted = (priorityId: string) => {
    // If priority is linked to event
    const eventId = priorityId.replace('priority-', '');
    toggleEventCompleted(eventId);
  };

  const addPriority = (item: Omit<PriorityItem, 'id'>) => {
    // Adding priority creates an event
    addEvent({
      title: item.title,
      courseCode: item.courseCode,
      type: item.type === 'assignment' ? 'assignment' : item.type === 'study' ? 'study_session' : 'test',
      date: item.dueTime || '2026-09-30',
      startTime: '23:59',
      endTime: '23:59',
      location: 'Student Task Submission',
      source: {
        type: 'personal',
        label: 'Student Added Priority',
        verified: true,
      },
    });
  };

  // The critical information ripple: adding an event updates Planner, Home, Courses, Study, & Notifications!
  const addEvent = (event: Omit<ScheduleEvent, 'id'>): ScheduleEvent => {
    const newId = `evt-${Date.now()}`;
    const newEvent: ScheduleEvent = {
      ...event,
      id: newId,
    };

    setEvents((prev) => [newEvent, ...prev]);

    // 1. Dispatch dynamic Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `New ${event.type === 'assignment' ? 'Assignment' : event.type === 'test' ? 'Test' : 'Event'} Added`,
      body: `"${event.title}" scheduled for ${event.date} at ${event.startTime}. Added to Planner, Home, and ${event.courseCode}.`,
      timeAgo: 'Just now',
      type: event.type === 'assignment' ? 'deadline' : event.type === 'test' || event.type === 'exam' ? 'exam' : 'timetable',
      unread: true,
      actionableId: newId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // 2. Set Active Flow Consequence Trace so the user immediately sees the cross-module ripple!
    const targetCourse = courses.find((c) => c.code === event.courseCode);
    const existingUpcoming = targetCourse?.upcomingAssignments || 0;

    const flowTrace: FlowConsequence = {
      id: `flow-${Date.now()}`,
      triggerEventTitle: event.title,
      courseCode: event.courseCode,
      eventType: event.type,
      timestamp: 'Just now',
      consequences: {
        planner: `Scheduled in Academic Planner for ${event.date} (${event.startTime} - ${event.endTime || 'End'})`,
        home: `Elevated to "Your Priorities" and ${event.date === '2026-09-29' ? "Today's Schedule" : "Coming Next"}`,
        courses: `${event.courseCode} pending count increased to ${existingUpcoming + 1} assignments`,
        study: `Study Recommendation dynamically adjusted focus to "${event.title} Preparation"`,
        notifications: `Contextual alert dispatched to your notification center with direct shortcut`,
      },
    };

    setActiveFlowConsequence(flowTrace);
    triggerCelebration();

    // Persist new event/task to PostgreSQL
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await persistStudyMaterial(
          {
            university: selectedUniversity,
            type: 'task',
            event: newEvent,
          },
          session?.access_token
        );
      } catch (err) {
        console.warn('[CourseMate Cloud] Task persistence note:', err);
      }
    })();

    return newEvent;
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const clearFlowConsequence = () => {
    setActiveFlowConsequence(null);
  };

  const markAnnouncementRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const toggleCardMastered = (deckId: string, cardId: string) => {
    setFlashcardDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          cards: deck.cards.map((c) =>
            c.id === cardId ? { ...c, mastered: !c.mastered } : c
          ),
        };
      })
    );
  };

  const addFlashcardDeck = (deck: FlashcardDeck) => {
    setFlashcardDecks((prev) => {
      const idx = prev.findIndex((d) => d.id === deck.id || (d.courseCode === deck.courseCode && d.title === deck.title));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = deck;
        return next;
      }
      return [deck, ...prev];
    });
    triggerCelebration();

    // Persist flashcards to PostgreSQL
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await persistStudyMaterial(
          {
            university: selectedUniversity,
            type: 'flashcard_deck',
            deck,
          },
          session?.access_token
        );
      } catch (err) {
        console.warn('[CourseMate Cloud] Deck persistence note:', err);
      }
    })();
  };

  const addQuiz = (quiz: Quiz) => {
    setQuizzes((prev) => {
      const idx = prev.findIndex((q) => q.id === quiz.id || (q.courseCode === quiz.courseCode && q.title === quiz.title));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = quiz;
        return next;
      }
      return [quiz, ...prev];
    });
    triggerCelebration();
  };

  const toggleJoinStudyGroup = (id: string) => {
    setStudyGroups((prev) =>
      prev.map((group) => {
        if (group.id !== id) return group;
        const nextIsMember = !group.isMember;
        return {
          ...group,
          isMember: nextIsMember,
          membersCount: nextIsMember
            ? group.membersCount + 1
            : Math.max(1, group.membersCount - 1),
        };
      })
    );
  };

  const triggerConnectionSync = (id: string) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === id ? { ...conn, status: 'syncing' } : conn))
    );
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === id
            ? { ...conn, status: 'connected', lastSync: 'Just now' }
            : conn
        )
      );
    }, 1200);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const logStudyTime = (minutes: number, courseCode?: string) => {
    const hours = Number((minutes / 60).toFixed(1));
    const xpAwarded = Math.round(minutes * 2.5);

    setStudent((prev) => ({
      ...prev,
      weeklyStudyHoursLogged: Number(
        (prev.weeklyStudyHoursLogged + hours).toFixed(1)
      ),
      xpPoints: (prev.xpPoints || 1240) + xpAwarded,
    }));

    // Advance Active Campus Challenges
    setCampusChallenges((prev) =>
      prev.map((ch) => {
        let nextProgress = ch.progressPercent || 0;
        let advanced = false;

        // Library Study Challenge (ch-3)
        if (ch.id === 'ch-3' && ch.isJoined) {
          const addedPercent = Math.max(5, Math.round((minutes / 900) * 100));
          nextProgress = Math.min(100, nextProgress + addedPercent);
          advanced = true;
        }

        // Academic Sprint (ch-1)
        if (ch.id === 'ch-1' && ch.isJoined && (!courseCode || courseCode === rawCourses[0]?.code)) {
          nextProgress = Math.min(100, nextProgress + 15);
          advanced = true;
        }

        if (advanced && nextProgress >= 100 && (ch.progressPercent || 0) < 100) {
          // Generate Challenge Completed Notification
          setTimeout(() => {
            setNotifications((n) => [
              {
                id: `notif-${Date.now()}`,
                title: `🏆 Challenge Completed: ${ch.title}`,
                body: `Outstanding! You conquered this challenge and earned +${ch.xpReward} XP & the "${ch.badge}" badge!`,
                timeAgo: 'Just now',
                type: 'study_window',
                unread: true,
              },
              ...n,
            ]);
          }, 300);
        }

        return advanced ? { ...ch, progressPercent: nextProgress } : ch;
      })
    );

    // Generate study logged notification with XP reward
    const studyNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Study Session Logged',
      body: `Added ${minutes}m of focused study (+${xpAwarded} XP). Weekly target updated & challenges progressed!`,
      timeAgo: 'Just now',
      type: 'study_window',
      unread: true,
    };
    setNotifications((n) => [studyNotif, ...n]);

    triggerCelebration();
  };

  const openModal = (modal: ModalType, data?: any) => {
    setActiveModal(modal);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  // Campus Hub Actions
  const toggleJoinCommunity = (id: string) => {
    setCampusCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextJoined = !c.isJoined;
        return {
          ...c,
          isJoined: nextJoined,
          memberCount: nextJoined ? c.memberCount + 1 : Math.max(1, c.memberCount - 1),
        };
      })
    );
    triggerCelebration();
  };

  const toggleRsvpEvent = (id: string) => {
    setCampusEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextRsvp = !e.isRsvpd;
        return {
          ...e,
          isRsvpd: nextRsvp,
          rsvpCount: nextRsvp ? e.rsvpCount + 1 : Math.max(0, e.rsvpCount - 1),
        };
      })
    );
    triggerCelebration();
  };

  const toggleSaveEvent = (id: string) => {
    setCampusEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isSaved: !e.isSaved } : e))
    );
  };

  const addCampusEventToPlanner = (campusEvt: CampusEvent) => {
    const newId = `evt-${Date.now()}`;
    const newEvent: ScheduleEvent = {
      id: newId,
      title: campusEvt.title,
      courseCode: campusEvt.category === 'Academic' ? 'ACAD' : 'CAMPUS',
      courseName: campusEvt.organizer,
      type: 'campus_event',
      date: campusEvt.date.includes('Tomorrow') ? '2026-09-30' : '2026-10-02',
      startTime: campusEvt.time.split(' - ')[0] || '14:00',
      endTime: campusEvt.time.split(' - ')[1] || '16:00',
      location: campusEvt.location,
      completed: false,
      source: {
        type: 'personal',
        label: campusEvt.sourceLabel,
        verified: true,
      },
      notes: campusEvt.description,
    };
    setEvents((prev) => [...prev, newEvent]);
    setCampusEvents((prev) =>
      prev.map((e) => (e.id === campusEvt.id ? { ...e, isRsvpd: true, rsvpCount: e.isRsvpd ? e.rsvpCount : e.rsvpCount + 1 } : e))
    );
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Event Synced to Planner',
        body: `"${campusEvt.title}" added to your calendar and reminder scheduled!`,
        timeAgo: 'Just now',
        type: 'timetable',
        unread: true,
        actionableId: newId,
      },
      ...prev,
    ]);
    triggerCelebration();
  };

  const toggleUpvoteQuestion = (id: string) => {
    setCampusQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextUpvoted = !q.hasUpvoted;
        return {
          ...q,
          hasUpvoted: nextUpvoted,
          upvotesCount: nextUpvoted ? q.upvotesCount + 1 : Math.max(0, q.upvotesCount - 1),
        };
      })
    );
  };

  const addQuestion = (q: { title: string; body: string; courseCode: string }) => {
    const newQuestion: CampusQuestion = {
      id: `q-${Date.now()}`,
      title: q.title,
      body: q.body,
      courseCode: q.courseCode,
      authorName: student.name,
      authorYear: `Year ${student.year} CS`,
      timeAgo: 'Just now',
      answersCount: 0,
      upvotesCount: 1,
      isAnswered: false,
      hasUpvoted: true,
      tags: [q.courseCode, 'Question'],
    };
    setCampusQuestions((prev) => [newQuestion, ...prev]);
    setStudent((prev) => ({ ...prev, xpPoints: (prev.xpPoints || 1240) + 50 }));
    setCampusChallenges((prev) =>
      prev.map((ch) =>
        ch.id === 'ch-4'
          ? { ...ch, progressPercent: Math.min(100, (ch.progressPercent || 33) + 33) }
          : ch
      )
    );
    triggerCelebration();
  };

  const voteCampusPulse = (optionId: string) => {
    setCampusPulse((prev) => {
      if (prev.userVotedOptionId === optionId) return prev;
      return {
        ...prev,
        userVotedOptionId: optionId,
        totalVotes: prev.totalVotes + 1,
        options: prev.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
      };
    });
    triggerCelebration();
  };

  const addStudyGroup = (grp: Omit<StudyGroup, 'id' | 'membersCount' | 'isMember'>) => {
    const newGroup: StudyGroup = {
      ...grp,
      university: grp.university || selectedUniversity,
      id: `grp-${Date.now()}`,
      membersCount: 1,
      isMember: true,
      adminName: student.name,
    };
    setStudyGroups((prev) => [newGroup, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Study Group Created',
        body: `Created "${newGroup.name}" for ${newGroup.courseCode}. Open for peers to join!`,
        timeAgo: 'Just now',
        type: 'study_window',
        unread: true,
      },
      ...prev,
    ]);
    triggerCelebration();
  };

  const addStudySessionToPlanner = (grp: StudyGroup) => {
    const newId = `evt-${Date.now()}`;
    const newEvent: ScheduleEvent = {
      id: newId,
      title: `${grp.courseCode} Study Session: ${grp.topic}`,
      courseCode: grp.courseCode,
      courseName: grp.name,
      type: 'study_session',
      date: '2026-09-29',
      startTime: '16:00',
      endTime: '17:30',
      location: grp.location,
      completed: false,
      source: {
        type: 'student_shared',
        label: `Peer Group (${grp.adminName})`,
        verified: true,
      },
      notes: `Study group session for ${grp.topic}. Led by ${grp.adminName}.`,
    };
    setEvents((prev) => [...prev, newEvent]);
    if (!grp.isMember) {
      toggleJoinStudyGroup(grp.id);
    }
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Study Session Added to Planner',
        body: `${grp.courseCode} study session synced for 16:00 today at ${grp.location}.`,
        timeAgo: 'Just now',
        type: 'study_window',
        unread: true,
        actionableId: newId,
      },
      ...prev,
    ]);
    triggerCelebration();
  };

  const toggleJoinChallenge = (id: string) => {
    setCampusChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id !== id) return ch;
        const nextJoined = !ch.isJoined;
        return {
          ...ch,
          isJoined: nextJoined,
          participantsCount: nextJoined ? ch.participantsCount + 1 : Math.max(1, ch.participantsCount - 1),
        };
      })
    );
    triggerCelebration();
  };

  const syncPortalData = (payload: any, universityName?: SupportedUniversity) => {
    if (!payload || payload.status !== 'success') return;

    const rawStudent = payload.student || {};
    const coursesList = payload.courses || [];
    const fees = payload.feeSummary || null;

    const targetUniversity: SupportedUniversity =
      universityName ||
      (payload.university as SupportedUniversity) ||
      (rawStudent.university as SupportedUniversity) ||
      selectedUniversity ||
      'ISBAT University';

    setSelectedUniversity(targetUniversity);

    const colors = ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
    const mappedCourses: Course[] = coursesList.map((c: any, index: number) => ({
      id: (c.id || c.code || `course-${index}`).toLowerCase(),
      code: c.code || `CRS${index + 101}`,
      name: c.title || c.name || c.code || 'Course Unit',
      lecturer: c.lecturer || `${targetUniversity} Faculty Lecturer`,
      credits: c.creditUnits || c.credits || 3,
      creditUnits: c.creditUnits || c.credits || 3,
      color: c.color || colors[index % colors.length],
      room: c.room || `Lab ${index + 1} / Main Campus`,
      nextClass: c.nextClass || (index === 0 ? 'Today · 09:00' : index === 1 ? 'Today · 14:00' : 'Tomorrow · 11:00'),
      progressPct: c.progressPct ?? Math.round(50 + ((index * 7) % 45)),
      gradeEstimate: c.grade || c.gradeEstimate || 'In Progress',
      upcomingAssignments: c.upcomingAssignments ?? 1,
      upcomingTests: c.upcomingTests ?? (c.timetable?.examDate && c.timetable.examDate !== 'Not Yet Scheduled' ? 1 : 0),
      materialsCount: c.materialsCount ?? (12 + index * 3),
      syllabusTopics: c.syllabusTopics || [
        `${c.title || c.name || c.code} Core Principles`,
        'Applied Problem Solving & Worksheets',
        'Midterm Test Revision & Case Studies',
        'Final Exam Mastery & Past Papers',
      ],
      timetable: c.timetable,
      assessments: c.assessments,
    }));

    const formattedStudent: StudentProfile = {
      name: rawStudent.name || (targetUniversity === 'Makerere University' ? 'KATO SAMUEL' : 'BUSINGE SAMUEL'),
      preferredName: (rawStudent.preferredName || rawStudent.name || 'Samuel').split(' ')[0],
      studentId: rawStudent.studentId || rawStudent.regNumber || (targetUniversity === 'Makerere University' ? '23/U/10492' : 'HECS26DA'),
      regNumber: rawStudent.regNumber || rawStudent.studentId || (targetUniversity === 'Makerere University' ? '23/U/10492' : 'HECS26DA'),
      university: targetUniversity,
      faculty: rawStudent.faculty || (targetUniversity === 'Makerere University' ? 'College of Computing & Information Sciences (CoCIS)' : targetUniversity === 'MUBS' ? 'Faculty of Computing & Informatics' : 'Faculty of Information & Technology'),
      programme: rawStudent.programme || rawStudent.program || (targetUniversity === 'Makerere University' ? 'Bachelor of Science in Computer Science' : 'Higher Education Certificate in Computing'),
      semesterName: rawStudent.semesterName || rawStudent.semester || 'Year One - Semester Two',
      academicStatus: rawStudent.academicStatus || 'Active',
      year: rawStudent.year || 1,
      semester: rawStudent.semester || 2,
      currentGpa: rawStudent.currentGpa || (student.currentGpa && student.currentGpa > 0 ? student.currentGpa : 4.25),
      studyStreakDays: student.studyStreakDays || 8,
      weeklyStudyHoursGoal: student.weeklyStudyHoursGoal || 20,
      weeklyStudyHoursLogged: student.weeklyStudyHoursLogged || 14.5,
      creditsCurrentSemester: coursesList.reduce((acc: number, c: any) => acc + (c.creditUnits || c.credits || 3), 0) || 18,
      xpPoints: (student.xpPoints || 1240) + 250,
      isSynced: true,
      syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      feeSummary: fees,
    };

    // Generate real exam schedule events from synced courses
    const portalEvents: ScheduleEvent[] = [];
    coursesList.forEach((c: any) => {
      if (c.timetable?.examDate && c.timetable.examDate !== 'Not Yet Scheduled') {
        portalEvents.push({
          id: `portal-exam-${c.code.toLowerCase()}`,
          title: `${c.code} Final Exam: ${c.title || c.name || c.code}`,
          courseCode: c.code,
          courseName: c.title || c.name || c.code,
          type: 'exam',
          date: '2026-09-30',
          startTime: c.timetable.examTime?.split(' - ')[0] || '14:30',
          endTime: c.timetable.examTime?.split(' - ')[1] || '17:30',
          location: `${targetUniversity} Examination Hall`,
          completed: false,
          urgent: true,
          source: {
            type: 'official_portal',
            label: `${targetUniversity} Official Timetable`,
            systemName: targetUniversity === 'ISBAT University' ? 'ISMIS Portal' : 'ACMIS Portal',
            verified: true,
            syncTimestamp: 'Just now',
          },
          notes: `Official exam scheduled via ${targetUniversity} portal. Assessments: Coursework ${c.assessments?.coursework || 'N/A'}, Class Test ${c.assessments?.classTest || 'N/A'}.`,
        });
      }
    });

    setStudent(formattedStudent);
    if (mappedCourses.length > 0) {
      setRawCourses(mappedCourses);
    }
    setFeeSummary(fees);
    setIsPortalSynced(true);

    const validCourseCodes = new Set(mappedCourses.map((c) => c.code.toUpperCase()));

    // Coursework assignments for the synced courses
    const courseAssignments: ScheduleEvent[] = mappedCourses.slice(0, 3).map((c, i) => ({
      id: `assignment-${c.code.toLowerCase()}`,
      title: `${c.code} Coursework Assignment`,
      courseCode: c.code,
      courseName: c.name,
      type: 'assignment',
      date: i === 0 ? '2026-10-02' : i === 1 ? '2026-10-04' : '2026-10-07',
      startTime: '23:59',
      endTime: '23:59',
      location: `${targetUniversity} Learning Portal`,
      completed: false,
      urgent: i === 0,
      weightPct: 20,
      source: {
        type: 'official_portal',
        label: `${targetUniversity} LMS`,
        verified: true,
      },
      notes: `Official coursework assignment for ${c.code}: ${c.name}. Submit via university portal.`,
    }));

    setEvents((prev) => {
      // Filter out any event whose course code doesn't belong to the newly synced courses
      const validPrev = prev.filter(
        (e) =>
          (!e.courseCode || validCourseCodes.has(e.courseCode.toUpperCase())) &&
          !e.id.startsWith('portal-exam-') &&
          !e.id.startsWith('assignment-')
      );
      return [...portalEvents, ...courseAssignments, ...validPrev];
    });

    const syncedDecks = createSyncedFlashcardDecks(mappedCourses);
    setFlashcardDecks(syncedDecks);

    const syncedQuizzes = createSyncedQuizzes(mappedCourses);
    setQuizzes(syncedQuizzes);

    const syncedGroups = createSyncedStudyGroups(mappedCourses, formattedStudent.name);
    setStudyGroups(syncedGroups);

    const syncedQuestions = createSyncedCampusQuestions(mappedCourses);
    setCampusQuestions(syncedQuestions);

    const newConns = getUniversityAcademicConnections(targetUniversity, true);
    setConnections(newConns);
    localStorage.setItem('coursemate_connections', JSON.stringify(newConns));

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `🎓 ${targetUniversity} Portal Successfully Synced`,
        body: `Synchronized academic profile for ${formattedStudent.name} (${formattedStudent.regNumber}): ${mappedCourses.length} course units & official fee ledger loaded.`,
        timeAgo: 'Just now',
        type: 'timetable',
        unread: true,
      },
      ...prev,
    ]);

    // Save full academic dataset to Supabase PostgreSQL in background
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await persistAcademicData(
          {
            university: targetUniversity,
            student: formattedStudent,
            courses: mappedCourses,
            feeSummary: fees,
            events: [...portalEvents, ...courseAssignments],
          },
          session?.access_token
        );
        setCloudSyncStatus('synced');
      } catch (err) {
        console.warn('[CourseMate Cloud Sync] Background persist note:', err);
      }
    })();
  };

  const loadUniversitySnapshot = (uni: SupportedUniversity) => {
    setSelectedUniversity(uni);
    const preset = UNIVERSITY_PRESETS[uni];
    if (!preset) return;

    syncPortalData(
      {
        status: 'success',
        university: uni,
        student: {
          ...preset.student,
          university: uni,
        },
        courses: preset.courses,
        feeSummary: preset.feeSummary,
      },
      uni
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        student,
        updateStudent,
        courses,
        selectedCourse,
        setSelectedCourse,
        events,
        addEvent,
        toggleEventCompleted,
        deleteEvent,
        priorities,
        togglePriorityCompleted,
        addPriority,
        studyRecommendation,
        announcements,
        markAnnouncementRead,
        flashcardDecks,
        toggleCardMastered,
        addFlashcardDeck,
        quizzes,
        addQuiz,
        studyMaterials,
        studyGroups,
        toggleJoinStudyGroup,
        addStudyGroup,
        addStudySessionToPlanner,
        opportunities,
        marketplaceItems,
        campusServices,
        connections,
        triggerConnectionSync,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsRead,
        theme,
        toggleTheme,
        viewportMode,
        setViewportMode,
        activeModal,
        modalData,
        openModal,
        closeModal,
        triggerCelebration,
        simulationState,
        setSimulationState,
        logStudyTime,
        activeFlowConsequence,
        clearFlowConsequence,
        // Campus Hub Ecosystem
        campusCommunities,
        toggleJoinCommunity,
        campusEvents,
        toggleRsvpEvent,
        toggleSaveEvent,
        addCampusEventToPlanner,
        campusQuestions,
        toggleUpvoteQuestion,
        addQuestion,
        campusPulse,
        voteCampusPulse,
        forYouFeedItems,
        campusChallenges,
        toggleJoinChallenge,
        // Multi-University Abstraction & Portal Bridge
        selectedUniversity,
        setSelectedUniversity,
        loadUniversitySnapshot,
        isPortalSynced,
        feeSummary,
        syncPortalData,
        // Dedicated Onboarding Flow
        isOnboarded,
        setIsOnboarded,
        resetOnboarding,
        completeOnboarding,
        // Supabase Cloud Authentication & Sync Engine
        authSession,
        currentUser,
        cloudSyncStatus,
        signOut: handleSignOut,
        isSupabaseConnected: isSupabaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
