/**
 * useStudentDashboard
 * ---------------------------------------------------------------------------
 * Cache-and-Sync hook for student dashboard data.
 *
 * Strategy (in order):
 *   1. CACHE  — Query `enrolled_courses` + `student_academic_records` from
 *               Supabase directly with the authenticated user's session. If rows
 *               exist, hydrate AppContext immediately.
 *   2. SCRAPE — If no cached rows exist, POST /api/trigger-scrape which responds
 *               202 and runs the Playwright scrape in the background on the server.
 *   3. SYNC   — Subscribe to Supabase Realtime on `enrolled_courses` and
 *               `student_academic_records` filtered by `profile_id = user.id`.
 *               Any INSERT / UPDATE from the background scrape instantly pushes
 *               the new rows into React state — no polling required.
 *
 * Usage:
 *   const { status, courses, student, refetch } = useStudentDashboard(studentId);
 *
 * The hook integrates with AppContext so the whole app reacts to fresh data the
 * moment it lands in Supabase — whether sourced from cache or a live scrape.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { Course, StudentProfile, FeeSummary } from '../types';

// ---------------------------------------------------------------------------
// Status Types
// ---------------------------------------------------------------------------

export type DashboardSyncStatus =
  | 'idle'      // Hook has not started yet.
  | 'loading'   // Reading the Supabase cache.
  | 'scraping'  // Cache was empty; background scrape has been dispatched.
  | 'synced'    // Data is available (from cache or realtime delivery).
  | 'error';    // Unrecoverable failure.

export interface UseStudentDashboardResult {
  /** Current lifecycle state of the hook. */
  status: DashboardSyncStatus;
  /** Courses array (from cache or realtime). Null while loading. */
  courses: Course[] | null;
  /** Student profile row (from cache or realtime). Null while loading. */
  student: StudentProfile | null;
  /** Fee summary from student_academic_records.fee_summary. */
  feeSummary: FeeSummary | null;
  /** Human-readable status message for display in UI. */
  statusMessage: string;
  /** True while waiting for the background scrape to deliver via Realtime. */
  isScrapePending: boolean;
  /** Manually re-run the full Cache -> Scrape -> Sync cycle. */
  refetch: () => void;
  /** Last time data was successfully synced. */
  lastSyncedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Row-to-Domain Mappers
// ---------------------------------------------------------------------------

function mapCourseRow(row: any, index: number): Course {
  const colors = ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
  return {
    id: (row.course_code ?? `course-${index}`).toLowerCase(),
    code: row.course_code ?? '',
    name: row.course_title ?? row.course_code ?? '',
    lecturer: row.lecturer ?? 'Faculty Lecturer',
    credits: row.credit_units ?? 3,
    creditUnits: row.credit_units ?? 3,
    color: row.color ?? colors[index % colors.length],
    room: row.room ?? 'Main Campus',
    nextClass: row.next_class ?? 'Check timetable',
    progressPct: row.progress_pct ?? 50,
    gradeEstimate: row.grade_estimate ?? 'In Progress',
    upcomingAssignments: row.upcoming_assignments ?? 0,
    upcomingTests: row.upcoming_tests ?? 0,
    materialsCount: row.materials_count ?? 12,
    syllabusTopics: Array.isArray(row.syllabus_topics) ? row.syllabus_topics : [],
    timetable: row.timetable ?? {},
    assessments: row.assessments ?? {},
  };
}

function mapStudentRow(row: any, profile?: any): StudentProfile {
  return {
    name: row.student_name ?? 'Student',
    preferredName: row.preferred_name ?? (row.student_name ?? 'Student').split(' ')[0],
    studentId: row.student_id ?? row.reg_number ?? '',
    regNumber: row.reg_number ?? row.student_id ?? '',
    university: row.university ?? 'ISBAT University',
    faculty: row.faculty ?? '',
    programme: row.programme ?? '',
    semesterName: row.semester_name ?? '',
    academicStatus: row.academic_status ?? 'Active',
    year: row.year ?? 1,
    semester: row.semester ?? 2,
    currentGpa: Number(row.current_gpa) || 0,
    studyStreakDays: row.study_streak_days ?? 0,
    weeklyStudyHoursGoal: Number(row.weekly_study_hours_goal) || 20,
    weeklyStudyHoursLogged: Number(row.weekly_study_hours_logged) || 0,
    creditsCurrentSemester: row.credits_current_semester ?? 18,
    xpPoints: profile?.xp_points ?? 1240,
    isSynced: row.is_synced ?? true,
    syncedAt: row.last_synced_at ?? undefined,
    feeSummary: row.fee_summary ?? null,
    avatarUrl: profile?.avatar_url ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param studentId  The student's registration number / student_id. Used as a
 *                   hint when dispatching the background scrape. If omitted the
 *                   server will attempt to resolve it from the DB record.
 * @param university Optional university name override (defaults to context value).
 */
export function useStudentDashboard(
  studentId?: string,
  university?: string
): UseStudentDashboardResult {
  const { syncPortalData, selectedUniversity, authSession } = useApp();

  const [status, setStatus] = useState<DashboardSyncStatus>('idle');
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initialising dashboard...');
  const [isScrapePending, setIsScrapePending] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Prevent concurrent cycles on fast re-renders.
  const cycleRunning = useRef(false);
  // Hold a reference so we can clean up the Realtime channel.
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const removeChannel = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  /**
   * Apply a fresh set of rows from Supabase (from cache or a realtime event)
   * into local state AND into AppContext so all screens update instantly.
   */
  const applyRows = useCallback(
    (courseRows: any[], studentRow: any | null, profileRow?: any) => {
      const mappedCourses = courseRows.map(mapCourseRow);
      const mappedStudent = studentRow ? mapStudentRow(studentRow, profileRow) : null;
      const fees: FeeSummary | null = studentRow?.fee_summary ?? null;

      setCourses(mappedCourses);
      setStudent(mappedStudent);
      setFeeSummary(fees);
      setLastSyncedAt(new Date());
      setStatus('synced');
      setIsScrapePending(false);
      setStatusMessage('Dashboard synced from cloud cache.');

      // Push into AppContext so every tab (Home, Courses, Study, etc.) reacts.
      if (mappedStudent || mappedCourses.length > 0) {
        syncPortalData(
          {
            status: 'success',
            student: mappedStudent ?? undefined,
            courses: courseRows, // raw rows — syncPortalData maps these internally
            feeSummary: fees,
          },
          (mappedStudent?.university as any) ?? selectedUniversity
        );
      }
    },
    [syncPortalData, selectedUniversity]
  );

  // -------------------------------------------------------------------------
  // Phase 1 + 2: Cache read -> optional scrape dispatch
  // -------------------------------------------------------------------------

  const runCacheAndSync = useCallback(async () => {
    if (cycleRunning.current) return;
    cycleRunning.current = true;

    try {
      setStatus('loading');
      setStatusMessage('Checking your academic cache...');

      // If Supabase is not configured or there is no active session, skip.
      if (!isSupabaseConfigured || !authSession) {
        setStatus('synced');
        setStatusMessage('Running in offline mode. Connect Supabase to enable cloud sync.');
        return;
      }

      const profileId = authSession.user.id;
      const targetUniversity = university ?? selectedUniversity ?? 'ISBAT University';

      // 1. CACHE: read enrolled_courses.
      const { data: cachedCourses, error: courseErr } = await supabase
        .from('enrolled_courses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('university', targetUniversity)
        .order('course_code', { ascending: true });

      if (courseErr) {
        console.warn('[useStudentDashboard] Cache read error (enrolled_courses):', courseErr.message);
      }

      // 1b. CACHE: read student_academic_records.
      const { data: cachedStudent, error: studentErr } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('profile_id', profileId)
        .eq('university', targetUniversity)
        .maybeSingle();

      if (studentErr) {
        console.warn('[useStudentDashboard] Cache read error (student_academic_records):', studentErr.message);
      }

      const hasCachedCourses = Array.isArray(cachedCourses) && cachedCourses.length > 0;

      if (hasCachedCourses) {
        // Cache HIT — hydrate state immediately.
        console.log(
          `[useStudentDashboard] Cache hit: ${cachedCourses.length} courses, student: ${cachedStudent ? 'yes' : 'no'}`
        );
        applyRows(cachedCourses, cachedStudent ?? null);
      } else {
        // Cache MISS — dispatch a background scrape and wait for Realtime.
        console.log('[useStudentDashboard] Cache miss — dispatching background scrape...');
        setStatus('scraping');
        setIsScrapePending(true);
        setStatusMessage('No cached data found. Syncing from your university portal...');

        try {
          const resp = await fetch('/api/trigger-scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authSession.access_token}`,
            },
            body: JSON.stringify({
              student_id: studentId,
              university: targetUniversity,
            }),
          });

          if (resp.status === 202) {
            console.log('[useStudentDashboard] Scrape job accepted (202). Waiting for Realtime...');
            setStatusMessage('Portal scrape in progress. Your dashboard will update automatically...');
          } else {
            const payload = await resp.json().catch(() => ({}));
            console.warn('[useStudentDashboard] Unexpected trigger-scrape response:', resp.status, payload);
            setStatus('error');
            setStatusMessage('Could not trigger portal scrape. Please try again.');
            setIsScrapePending(false);
          }
        } catch (fetchErr: any) {
          console.error('[useStudentDashboard] trigger-scrape fetch error:', fetchErr.message);
          setStatus('error');
          setStatusMessage('Could not reach the scrape endpoint. Check your connection.');
          setIsScrapePending(false);
        }
      }
    } catch (err: any) {
      console.error('[useStudentDashboard] Unexpected error in cache cycle:', err.message);
      setStatus('error');
      setStatusMessage('Unexpected error loading dashboard data.');
    } finally {
      cycleRunning.current = false;
    }
  }, [authSession, university, selectedUniversity, studentId, applyRows]);

  // -------------------------------------------------------------------------
  // Re-fetch helper (used by Realtime callbacks)
  // -------------------------------------------------------------------------

  const refreshFromSupabase = useCallback(
    async (profileId: string, targetUniversity: string) => {
      const [{ data: courseRows }, { data: studentRow }] = await Promise.all([
        supabase
          .from('enrolled_courses')
          .select('*')
          .eq('profile_id', profileId)
          .eq('university', targetUniversity)
          .order('course_code', { ascending: true }),
        supabase
          .from('student_academic_records')
          .select('*')
          .eq('profile_id', profileId)
          .eq('university', targetUniversity)
          .maybeSingle(),
      ]);

      applyRows(courseRows ?? [], studentRow ?? null);
    },
    [applyRows]
  );

  // -------------------------------------------------------------------------
  // Phase 3: Realtime subscription
  // -------------------------------------------------------------------------

  const subscribeRealtime = useCallback(() => {
    if (!isSupabaseConfigured || !authSession) return;

    removeChannel();

    const profileId = authSession.user.id;
    const targetUniversity = university ?? selectedUniversity ?? 'ISBAT University';

    console.log(`[useStudentDashboard] Opening Realtime channel for profile ${profileId}`);

    const handler = async () => {
      await refreshFromSupabase(profileId, targetUniversity);
    };

    const channel = supabase
      .channel(`student-dashboard:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrolled_courses',
          filter: `profile_id=eq.${profileId}`,
        },
        async () => {
          console.log('[useStudentDashboard] Realtime: enrolled_courses INSERT');
          await handler();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrolled_courses',
          filter: `profile_id=eq.${profileId}`,
        },
        async () => {
          console.log('[useStudentDashboard] Realtime: enrolled_courses UPDATE');
          await handler();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_academic_records',
          filter: `profile_id=eq.${profileId}`,
        },
        async () => {
          console.log('[useStudentDashboard] Realtime: student_academic_records INSERT');
          await handler();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_academic_records',
          filter: `profile_id=eq.${profileId}`,
        },
        async () => {
          console.log('[useStudentDashboard] Realtime: student_academic_records UPDATE');
          await handler();
        }
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') {
          console.log('[useStudentDashboard] Realtime channel SUBSCRIBED.');
        } else if (channelStatus === 'CHANNEL_ERROR') {
          console.warn('[useStudentDashboard] Realtime CHANNEL_ERROR — will retry on next mount.');
        }
      });

    realtimeChannelRef.current = channel;
  }, [authSession, university, selectedUniversity, removeChannel, refreshFromSupabase]);

  // -------------------------------------------------------------------------
  // Orchestration Effect
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Subscribe to Realtime FIRST so we never miss an event that arrives while
    // the cache read is in flight.
    subscribeRealtime();
    runCacheAndSync();

    return () => {
      removeChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.user?.id]);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const refetch = useCallback(() => {
    cycleRunning.current = false;
    setCourses(null);
    setStudent(null);
    setStatus('idle');
    setStatusMessage('Refreshing dashboard...');
    subscribeRealtime();
    runCacheAndSync();
  }, [subscribeRealtime, runCacheAndSync]);

  return {
    status,
    courses,
    student,
    feeSummary,
    statusMessage,
    isScrapePending,
    lastSyncedAt,
    refetch,
  };
}
