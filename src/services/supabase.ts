import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SupportedUniversity, StudentProfile, Course, ScheduleEvent, FlashcardDeck, FeeSummary } from '../types';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock_key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('xyzcompany')
);

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface CloudUserDataResponse {
  status: 'success' | 'empty' | 'error';
  profile?: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    selectedUniversity: SupportedUniversity;
    xpPoints?: number;
  };
  student?: StudentProfile;
  courses?: Course[];
  events?: ScheduleEvent[];
  flashcardDecks?: FlashcardDeck[];
  feeSummary?: FeeSummary;
  message?: string;
}

/**
 * Trigger Real Google OAuth flow with Supabase
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    console.info('[Supabase Auth] Using local mock Google OAuth session');
    return { data: { url: null }, error: null, isMock: true };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error, isMock: false };
}

/**
 * Sign in or sign up with Student Email
 */
export async function signInWithEmail(email: string) {
  if (!isSupabaseConfigured) {
    console.info('[Supabase Auth] Using local email auth session');
    return { data: { user: { email, id: `user-mock-${Date.now()}` } }, error: null, isMock: true };
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { data, error, isMock: false };
}

/**
 * Sign in or sign up with Student Email and Password
 */
export async function signInWithEmailPassword(email: string, password: string) {
  if (!isSupabaseConfigured) {
    console.info('[Supabase Auth] Using local email/password session');
    return { data: { user: { email, id: `user-mock-${Date.now()}` } }, error: null, isMock: true };
  }

  // 1. Try sign in first
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInErr && signInData.user) {
    return { data: signInData, error: null, isMock: false };
  }

  // 2. If user not found / first time, try signup
  if (signInErr && (signInErr.message?.includes('Invalid login credentials') || signInErr.status === 400)) {
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!signUpErr && signUpData.user) {
      return { data: signUpData, error: null, isMock: false };
    }
  }

  return { data: signInData, error: signInErr, isMock: false };
}

/**
 * Sign out user
 */
export async function signOutUser() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * Fetch full cloud state from backend proxy
 */
export async function fetchCloudUserData(token?: string): Promise<CloudUserDataResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/sync/fetch-user-data', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return { status: 'error', message: `Server returned ${response.status}` };
    }

    const data: CloudUserDataResponse = await response.json();
    return data;
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to fetch cloud user data:', err.message);
    return { status: 'error', message: err.message };
  }
}

/**
 * Save scraped academic data to PostgreSQL via Backend Proxy
 */
export async function persistAcademicData(payload: {
  university: SupportedUniversity;
  student: Partial<StudentProfile>;
  courses: Course[];
  feeSummary?: FeeSummary | null;
  events?: ScheduleEvent[];
}, token?: string) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/sync/persist-academic-data', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to persist academic data:', err.message);
    return { status: 'error', message: err.message };
  }
}

/**
 * Save AI Flashcard Deck or Study Planner items to Cloud
 */
export async function persistStudyMaterial(payload: {
  university?: SupportedUniversity;
  type: 'flashcard_deck' | 'task' | 'all_decks';
  deck?: FlashcardDeck;
  decks?: FlashcardDeck[];
  event?: ScheduleEvent;
}, token?: string) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/sync/save-study-material', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to persist study material:', err.message);
    return { status: 'error', message: err.message };
  }
}
