export type TabType = 'home' | 'planner' | 'courses' | 'study' | 'campus' | 'profile';

export type SupportedUniversity = 'ISBAT University' | 'Makerere University' | 'Kyambogo University' | 'MUBS';

export const SUPPORTED_UNIVERSITIES: SupportedUniversity[] = [
  'ISBAT University',
  'Makerere University',
  'Kyambogo University',
  'MUBS',
];

export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';

export type EventType = 'class' | 'assignment' | 'test' | 'exam' | 'study_session' | 'personal_task' | 'campus_event';

export type SourceType = 'official_portal' | 'faculty' | 'student_shared' | 'uploaded_doc' | 'personal';

export interface SourceMeta {
  type: SourceType;
  label: string;
  systemName?: string;
  verified: boolean;
  syncTimestamp?: string;
}

export interface ConflictNotice {
  detected: boolean;
  title: string;
  sourceA: { name: string; date: string; time: string };
  sourceB: { name: string; date: string; time: string };
  resolutionRecommendation: string;
}

export interface FeePaymentItem {
  category: string;
  item: string;
  status: 'Paid' | 'Due' | string;
}

export interface FeeSummary {
  totalBilled: string;
  totalPaid: string;
  outstandingBalance: string;
  paymentsBreakdown?: FeePaymentItem[];
}

export interface StudentProfile {
  name: string;
  preferredName: string;
  studentId: string;
  regNumber?: string;
  university: string;
  faculty: string;
  programme: string;
  year: number;
  semester: number;
  semesterName?: string;
  academicStatus?: string;
  avatarUrl?: string;
  currentGpa: number;
  studyStreakDays: number;
  weeklyStudyHoursGoal: number;
  weeklyStudyHoursLogged: number;
  creditsCurrentSemester: number;
  xpPoints?: number;
  isSynced?: boolean;
  syncedAt?: string;
  feeSummary?: FeeSummary;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  credits: number;
  creditUnits?: number;
  color: string;
  room: string;
  nextClass: string;
  progressPct: number;
  gradeEstimate: string;
  upcomingAssignments: number;
  upcomingTests: number;
  materialsCount: number;
  syllabusTopics: string[];
  timetable?: {
    examDate?: string;
    examTime?: string;
  };
  assessments?: {
    coursework?: string;
    classTest?: string;
  };
}

export interface ScheduleEvent {
  id: string;
  title: string;
  courseCode: string;
  courseName?: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  completed?: boolean;
  urgent?: boolean;
  source: SourceMeta;
  conflict?: ConflictNotice;
  notes?: string;
  submissionLink?: string;
}

export interface PriorityItem {
  id: string;
  title: string;
  courseCode: string;
  urgencyText: string;
  dueTime: string;
  type: 'assignment' | 'test' | 'exam' | 'study';
  completed: boolean;
  weightPct?: number;
}

export interface StudyRecommendation {
  courseCode: string;
  courseName: string;
  topic: string;
  availableMinutes: number;
  activeRecallMinutes: number;
  practiceMinutes: number;
  reason: string;
  difficulty: 'Easy' | 'Medium' | 'High-yield';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  source: string;
  category: 'official' | 'faculty' | 'guild' | 'urgent';
  date: string;
  read: boolean;
  actionLabel?: string;
  university?: SupportedUniversity;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  mastered: boolean;
}

export interface FlashcardDeck {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  cards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  courseCode: string;
  title: string;
  estimatedMinutes: number;
  questions: QuizQuestion[];
}

export interface StudyMaterial {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  type: 'pdf' | 'slides' | 'notes' | 'past_paper';
  fileSize: string;
  uploadDate: string;
  source: string;
  summary: string;
  downloadUrl?: string;
  university?: SupportedUniversity;
}

export interface StudyGroup {
  id: string;
  courseCode: string;
  name: string;
  membersCount: number;
  maxMembers: number;
  schedule: string;
  location: string;
  topic: string;
  isMember: boolean;
  adminName: string;
  university?: SupportedUniversity;
}

export interface CampusOpportunity {
  id: string;
  title: string;
  organization: string;
  type: 'internship' | 'scholarship' | 'job' | 'competition' | 'fellowship';
  deadline: string;
  stipendOrAward: string;
  location: string;
  requirements: string[];
  description: string;
  university?: SupportedUniversity;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  priceUgx: number;
  category: 'Books' | 'Electronics' | 'Hostel Gear' | 'Stationery';
  condition: 'Like New' | 'Good' | 'Fair';
  sellerName: string;
  sellerYear: string;
  location: string;
  description: string;
  contactNumber: string;
  available: boolean;
  university?: SupportedUniversity;
}

export interface CampusService {
  id: string;
  name: string;
  department: string;
  location: string;
  hours: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  quickServices: string[];
  university?: SupportedUniversity;
}

export interface AcademicConnection {
  id: string;
  name: string;
  type: 'portal' | 'lms' | 'whatsapp' | 'documents';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  institution: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  type: 'deadline' | 'exam' | 'timetable' | 'announcement' | 'study_window';
  unread: boolean;
  actionableId?: string;
}

export interface FlowConsequence {
  id: string;
  triggerEventTitle: string;
  courseCode: string;
  eventType: EventType;
  timestamp: string;
  consequences: {
    planner: string;
    home: string;
    courses: string;
    study: string;
    notifications: string;
  };
}

export interface CampusCommunity {
  id: string;
  name: string;
  category: 'My Courses' | 'Programme' | 'Faculty' | 'Clubs' | 'Interests' | 'Student Life';
  courseCode?: string;
  memberCount: number;
  unreadDiscussionsCount: number;
  recentPostSnippet: string;
  recentPostAuthor: string;
  recentPostTime: string;
  isJoined: boolean;
  tag: string;
  avatarColor: string;
  university?: SupportedUniversity;
}

export interface CampusEvent {
  id: string;
  title: string;
  category: 'Academic' | 'Careers' | 'Technology' | 'Clubs' | 'Sports' | 'Arts' | 'Workshops' | 'Student Life';
  date: string;
  time: string;
  location: string;
  organizer: string;
  description: string;
  isToday?: boolean;
  isTomorrow?: boolean;
  rsvpCount: number;
  isRsvpd: boolean;
  isSaved: boolean;
  sourceLabel: string;
  tags: string[];
  university?: SupportedUniversity;
}

export interface CampusQuestion {
  id: string;
  title: string;
  body: string;
  courseCode: string;
  courseName?: string;
  authorName: string;
  authorYear: string;
  timeAgo: string;
  answersCount: number;
  upvotesCount: number;
  isAnswered: boolean;
  hasUpvoted: boolean;
  topAnswerSnippet?: string;
  topAnswerAuthor?: string;
  tags: string[];
  university?: SupportedUniversity;
}

export interface CampusPulsePoll {
  id: string;
  question: string;
  totalVotes: number;
  userVotedOptionId?: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  quickStatuses: {
    id: string;
    user: string;
    text: string;
    time: string;
    tag: string;
  }[];
  university?: SupportedUniversity;
}

export interface ForYouFeedItem {
  id: string;
  type: 'announcement' | 'course_discussion' | 'study_group' | 'event' | 'opportunity';
  title: string;
  subtitle?: string;
  body: string;
  source: 'Official University' | 'Student Community' | 'CourseMate' | 'Student Post';
  sourceVerified?: boolean;
  timeLabel: string;
  badgeLabel: string;
  whyItMatters: string;
  actionLabel: string;
  actionType: 'join' | 'rsvp' | 'add_to_planner' | 'discuss' | 'apply' | 'view';
  urgencyLevel: 'high' | 'medium' | 'normal';
  targetData?: any;
  university?: SupportedUniversity;
}

export interface CampusChallenge {
  id: string;
  title: string;
  category: 'Coding' | 'Academic' | 'Campus Life' | 'Innovation';
  participantsCount: number;
  xpReward: number;
  badge: string;
  deadline: string;
  description: string;
  progressPercent?: number;
  isJoined: boolean;
  coverGradient: string;
  coverImage?: string;
  tag: string;
  university?: SupportedUniversity;
}

export type PaperType = 'Final Exam' | 'Midterm Test' | 'Coursework' | 'Syllabus';

export interface PastPaper {
  id: string;
  university: SupportedUniversity;
  course_code: string;
  course_title: string;
  academic_year: string;
  semester: string;
  paper_type: PaperType;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  uploaded_by?: string;
  uploader_name?: string;
  downloads_count: number;
  is_verified: boolean;
  created_at: string;
}
