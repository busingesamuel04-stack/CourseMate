/**
 * portalWatcher.ts
 * ────────────────────────────────────────────────────────────
 * CourseMate Background Portal Watcher & Change Detection Engine.
 *
 * Compares two student portal snapshots (ISBAT ERP / ACMIS) and returns
 * structured change events across:
 *  1. Coursework / Results (grades, coursework marks, CGPA/GPA)
 *  2. Exam Timetable (dates, venues, time slots)
 *  3. Tuition & Fee Ledger (payments, clearance status, exam permits)
 *  4. Course Registration (approved courses, additions, removals)
 */

export type PortalChangeType = 'GRADE' | 'EXAM' | 'FINANCE' | 'ENROLLMENT';
export type PortalChangeSeverity = 'info' | 'success' | 'warning' | 'urgent';

export type PortalDiffCategory =
  | 'exam_date_change'
  | 'exam_venue_change'
  | 'exam_time_change'
  | 'exam_scheduled'
  | 'coursework_mark'
  | 'result_released'
  | 'gpa_update'
  | 'cgpa_update'
  | 'attendance_drop'
  | 'fee_status_change'
  | 'fee_balance_change'
  | 'exam_permit_issued'
  | 'new_course'
  | 'dropped_course'
  | 'course_approved'
  | 'timetable_change';

export interface PortalChangeEvent {
  id?: string;
  type: PortalChangeType;
  title: string;
  message: string;
  severity: PortalChangeSeverity;
  /** Deep link route for in-app navigation: e.g. '/planner', '/courses', '/profile' */
  deepLink: string;
  courseCode?: string;
  courseTitle?: string;
  detectedAt: string;
  meta?: Record<string, unknown>;
  is_read?: boolean;
  isRead?: boolean;

  // Backward compatibility fields for legacy UI and push dispatching
  category: PortalDiffCategory | string;
  body: string;
  routeHint: 'planner' | 'profile' | 'courses' | 'campus';
}

/** Backward-compatible type alias */
export type PortalDiff = PortalChangeEvent;
export type PortalDiffSeverity = 'critical' | 'warning' | 'info';

// ── Snapshot Definitions ───────────────────────────────────────────────────

export interface CourseSnapshot {
  code: string;
  title?: string;
  examDate?: string | null;
  examTime?: string | null;
  examVenue?: string | null;
  attendancePercent?: number | null;
  courseworkMark?: number | null;
  courseworkTotal?: number | null;
  finalMark?: number | null;
  status?: string | null; // e.g. 'Approved', 'Pending', 'Registered'
}

export interface FeePaymentRecord {
  amount: number;
  date: string;
  reference?: string;
}

export interface FeeLedgerSnapshot {
  totalOwed?: number | null;
  totalPaid?: number | null;
  balance?: number | null;
  isCleared?: boolean | null;
  prnNumber?: string | null;
  examPermitIssued?: boolean | null;
  recentPayments?: FeePaymentRecord[];
}

export interface PortalSnapshot {
  gpa?: number | null;
  cgpa?: number | null;
  courses?: CourseSnapshot[];
  feeLedger?: FeeLedgerSnapshot | null;
  examPermit?: boolean | null;
  /** ISO timestamp when snapshot was captured */
  snapshotAt?: string;
}

// ── Helper functions ───────────────────────────────────────────────────────

const ATTENDANCE_WARNING_THRESHOLD = 75;

function normDate(raw?: string | null): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw).trim();
    return d.toISOString().split('T')[0];
  } catch {
    return String(raw).trim();
  }
}

function normTime(raw?: string | null): string {
  if (!raw) return '';
  return String(raw).trim().toLowerCase().replace(/\s+/g, '');
}

// ── 1. Academic & Course-Level Change Detection ────────────────────────────

function diffAcademicAndCourses(
  prevSnap: PortalSnapshot,
  freshSnap: PortalSnapshot
): PortalChangeEvent[] {
  const events: PortalChangeEvent[] = [];
  const now = new Date().toISOString();

  // 1A. Overall GPA / CGPA shifts
  if (
    prevSnap.gpa !== undefined &&
    prevSnap.gpa !== null &&
    freshSnap.gpa !== undefined &&
    freshSnap.gpa !== null &&
    Number(prevSnap.gpa) !== Number(freshSnap.gpa)
  ) {
    const prevGpa = Number(prevSnap.gpa);
    const freshGpa = Number(freshSnap.gpa);
    const improved = freshGpa >= prevGpa;
    const msg = `Semester GPA updated from ${prevGpa.toFixed(2)} → ${freshGpa.toFixed(2)}.`;
    events.push({
      type: 'GRADE',
      category: 'gpa_update',
      severity: improved ? 'success' : 'warning',
      title: `📊 GPA Update: ${freshGpa.toFixed(2)}`,
      message: msg,
      body: msg,
      deepLink: '/courses',
      routeHint: 'courses',
      detectedAt: now,
      meta: { prevGpa, freshGpa },
    });
  }

  if (
    prevSnap.cgpa !== undefined &&
    prevSnap.cgpa !== null &&
    freshSnap.cgpa !== undefined &&
    freshSnap.cgpa !== null &&
    Number(prevSnap.cgpa) !== Number(freshSnap.cgpa)
  ) {
    const prevCgpa = Number(prevSnap.cgpa);
    const freshCgpa = Number(freshSnap.cgpa);
    const improved = freshCgpa >= prevCgpa;
    const msg = `Cumulative CGPA is now ${freshCgpa.toFixed(2)} (previously ${prevCgpa.toFixed(2)}).`;
    events.push({
      type: 'GRADE',
      category: 'cgpa_update',
      severity: improved ? 'success' : 'info',
      title: `🏆 CGPA Recalculated: ${freshCgpa.toFixed(2)}`,
      message: msg,
      body: msg,
      deepLink: '/courses',
      routeHint: 'courses',
      detectedAt: now,
      meta: { prevCgpa, freshCgpa },
    });
  }

  // 1B. Course-level diffs
  const prevCourses = prevSnap.courses || [];
  const freshCourses = freshSnap.courses || [];
  const prevMap = new Map(prevCourses.map((c) => [c.code.trim().toUpperCase(), c]));
  const freshMap = new Map(freshCourses.map((c) => [c.code.trim().toUpperCase(), c]));

  // New modules added / registered
  for (const [code, fc] of freshMap) {
    if (!prevMap.has(code)) {
      const msg = `"${fc.title || code}" has been added to your registered modules.`;
      events.push({
        type: 'ENROLLMENT',
        category: 'new_course',
        severity: 'info',
        courseCode: code,
        courseTitle: fc.title,
        title: `📚 New Course Registered: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
      });
    }
  }

  // Dropped / de-registered modules
  for (const [code, pc] of prevMap) {
    if (!freshMap.has(code)) {
      const msg = `"${pc.title || code}" was removed from your active course enrollment.`;
      events.push({
        type: 'ENROLLMENT',
        category: 'dropped_course',
        severity: 'warning',
        courseCode: code,
        courseTitle: pc.title,
        title: `⚠️ Course Deregistered: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
      });
    }
  }

  // Per-course modifications
  for (const [code, fc] of freshMap) {
    const pc = prevMap.get(code);
    if (!pc) continue;

    // Course registration status changes (e.g. Pending -> Approved)
    const prevStatus = (pc.status || '').trim().toLowerCase();
    const freshStatus = (fc.status || '').trim().toLowerCase();
    if (freshStatus && prevStatus && freshStatus !== prevStatus) {
      const isApproved = freshStatus.includes('approv') || freshStatus.includes('clear') || freshStatus.includes('valid');
      const msg = `Registration status for "${fc.title || code}" updated: ${pc.status} → ${fc.status}.`;
      events.push({
        type: 'ENROLLMENT',
        category: 'course_approved',
        severity: isApproved ? 'success' : 'info',
        courseCode: code,
        courseTitle: fc.title,
        title: isApproved ? `✅ Course Approved: ${code}` : `Status Update: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
        meta: { prevStatus: pc.status, newStatus: fc.status },
      });
    }

    // ── Exam Timetable changes ──────────────────────────────────────────
    const prevExamDate = normDate(pc.examDate);
    const freshExamDate = normDate(fc.examDate);

    // Newly scheduled exam date
    if (!prevExamDate && freshExamDate) {
      const venueStr = fc.examVenue ? ` at ${fc.examVenue}` : '';
      const timeStr = fc.examTime ? ` (${fc.examTime})` : '';
      const msg = `Final exam for "${fc.title || code}" scheduled on ${freshExamDate}${venueStr}${timeStr}.`;
      events.push({
        type: 'EXAM',
        category: 'exam_scheduled',
        severity: 'warning',
        courseCode: code,
        courseTitle: fc.title,
        title: `📅 Exam Scheduled: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/planner',
        routeHint: 'planner',
        detectedAt: now,
        meta: { date: freshExamDate, venue: fc.examVenue, time: fc.examTime },
      });
    } else if (prevExamDate && freshExamDate && prevExamDate !== freshExamDate) {
      // Rescheduled exam date
      const venueStr = fc.examVenue ? ` at ${fc.examVenue}` : '';
      const msg = `Exam date moved from ${prevExamDate} → ${freshExamDate}${venueStr}. Check your revision plan.`;
      events.push({
        type: 'EXAM',
        category: 'exam_date_change',
        severity: 'urgent',
        courseCode: code,
        courseTitle: fc.title,
        title: `🚨 Exam Rescheduled: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/planner',
        routeHint: 'planner',
        detectedAt: now,
        meta: { prevDate: prevExamDate, newDate: freshExamDate, venue: fc.examVenue },
      });
    }

    // Exam venue changes
    if (pc.examVenue && fc.examVenue && pc.examVenue.trim() !== fc.examVenue.trim()) {
      const msg = `Exam room changed from "${pc.examVenue}" to "${fc.examVenue}".`;
      events.push({
        type: 'EXAM',
        category: 'exam_venue_change',
        severity: 'warning',
        courseCode: code,
        courseTitle: fc.title,
        title: `📍 Exam Venue Changed: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/planner',
        routeHint: 'planner',
        detectedAt: now,
        meta: { prevVenue: pc.examVenue, newVenue: fc.examVenue },
      });
    }

    // Exam time changes
    const prevTime = normTime(pc.examTime);
    const freshTime = normTime(fc.examTime);
    if (prevTime && freshTime && prevTime !== freshTime) {
      const msg = `Exam sitting time altered from ${pc.examTime} to ${fc.examTime}.`;
      events.push({
        type: 'EXAM',
        category: 'exam_time_change',
        severity: 'warning',
        courseCode: code,
        courseTitle: fc.title,
        title: `⏰ Exam Time Shifted: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/planner',
        routeHint: 'planner',
        detectedAt: now,
        meta: { prevTime: pc.examTime, newTime: fc.examTime },
      });
    }

    // ── Coursework / Test Marks ─────────────────────────────────────────
    if (
      fc.courseworkMark !== null &&
      fc.courseworkMark !== undefined &&
      fc.courseworkMark !== pc.courseworkMark
    ) {
      const maxStr = fc.courseworkTotal ? `/${fc.courseworkTotal}` : '';
      const markStr = `${fc.courseworkMark}${maxStr}`;
      const wasReleased = pc.courseworkMark === null || pc.courseworkMark === undefined;
      const isImproved = pc.courseworkMark !== null && pc.courseworkMark !== undefined && fc.courseworkMark > pc.courseworkMark;

      const title = wasReleased ? `📝 Mark Released: ${code}` : `📝 Mark Updated: ${code}`;
      const msg = `Coursework score for "${fc.title || code}" is now ${markStr}.`;
      events.push({
        type: 'GRADE',
        category: 'coursework_mark',
        severity: wasReleased ? 'success' : isImproved ? 'success' : 'info',
        courseCode: code,
        courseTitle: fc.title,
        title,
        message: msg,
        body: msg,
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
        meta: { prevMark: pc.courseworkMark, newMark: fc.courseworkMark, total: fc.courseworkTotal },
      });
    }

    // Final exam result released
    if (
      fc.finalMark !== null &&
      fc.finalMark !== undefined &&
      (pc.finalMark === null || pc.finalMark === undefined)
    ) {
      const msg = `Official final exam mark for "${fc.title || code}" has been published: ${fc.finalMark}%.`;
      events.push({
        type: 'GRADE',
        category: 'result_released',
        severity: 'success',
        courseCode: code,
        courseTitle: fc.title,
        title: `🎓 Final Result Published: ${code}`,
        message: msg,
        body: msg,
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
        meta: { finalMark: fc.finalMark },
      });
    }

    // Attendance drop below threshold (75%)
    if (
      fc.attendancePercent !== null &&
      fc.attendancePercent !== undefined &&
      fc.attendancePercent < ATTENDANCE_WARNING_THRESHOLD
    ) {
      const prev = pc.attendancePercent;
      if (prev === null || prev === undefined || prev >= ATTENDANCE_WARNING_THRESHOLD) {
        const msg = `Attendance dropped to ${fc.attendancePercent.toFixed(0)}% — below the 75% threshold. Risk of exam de-registration.`;
        events.push({
          type: 'GRADE',
          category: 'attendance_drop',
          severity: 'urgent',
          courseCode: code,
          courseTitle: fc.title,
          title: `🚨 Attendance Alert: ${code}`,
          message: msg,
          body: msg,
          deepLink: '/courses',
          routeHint: 'courses',
          detectedAt: now,
          meta: { prevAttendance: prev, newAttendance: fc.attendancePercent },
        });
      }
    }
  }

  return events;
}

// ── 2. Tuition & Fee Ledger Change Detection ───────────────────────────────

function diffFeeLedger(
  prevSnap: PortalSnapshot,
  freshSnap: PortalSnapshot
): PortalChangeEvent[] {
  const prev = prevSnap.feeLedger;
  const fresh = freshSnap.feeLedger;
  const events: PortalChangeEvent[] = [];
  const now = new Date().toISOString();

  // Check exam permit clearance at root or ledger level
  const prevPermit = Boolean(prevSnap.examPermit || prev?.examPermitIssued);
  const freshPermit = Boolean(freshSnap.examPermit || fresh?.examPermitIssued);
  if (!prevPermit && freshPermit) {
    const msg = 'Your official university examination clearance permit has been approved and issued by the bursar.';
    events.push({
      type: 'FINANCE',
      category: 'exam_permit_issued',
      severity: 'success',
      title: '🎫 Exam Permit Issued',
      message: msg,
      body: msg,
      deepLink: '/profile',
      routeHint: 'profile',
      detectedAt: now,
    });
  }

  if (!prev || !fresh) return events;

  // Fee clearance status flip
  if (prev.isCleared !== fresh.isCleared) {
    if (fresh.isCleared) {
      const msg = 'Your student tuition account is now 100% cleared for this semester. Exam access granted.';
      events.push({
        type: 'FINANCE',
        category: 'fee_status_change',
        severity: 'success',
        title: '✅ Tuition Cleared',
        message: msg,
        body: msg,
        deepLink: '/profile',
        routeHint: 'profile',
        detectedAt: now,
        meta: { prevCleared: prev.isCleared, freshCleared: fresh.isCleared },
      });
    } else {
      const msg = 'Tuition status has changed to UNCLEARED. Please verify your payment records with the finance bursary.';
      events.push({
        type: 'FINANCE',
        category: 'fee_status_change',
        severity: 'urgent',
        title: '⚠️ Tuition Clearance Revoked',
        message: msg,
        body: msg,
        deepLink: '/profile',
        routeHint: 'profile',
        detectedAt: now,
        meta: { prevCleared: prev.isCleared, freshCleared: fresh.isCleared },
      });
    }
  }

  // Tuition balance changes / payments credited
  const prevBal = Number(prev.balance ?? 0);
  const freshBal = Number(fresh.balance ?? 0);
  if (Math.abs(freshBal - prevBal) > 10) {
    const isPayment = freshBal < prevBal;
    const delta = Math.abs(freshBal - prevBal).toLocaleString();
    const newBalFormatted = Math.abs(freshBal).toLocaleString();

    if (isPayment) {
      const msg = `Payment credited! Balance decreased by UGX ${delta}. Outstanding: UGX ${newBalFormatted}.`;
      events.push({
        type: 'FINANCE',
        category: 'fee_balance_change',
        severity: 'success',
        title: '💰 Payment Credited',
        message: msg,
        body: msg,
        deepLink: '/profile',
        routeHint: 'profile',
        detectedAt: now,
        meta: { prevBalance: prevBal, newBalance: freshBal, paymentDelta: prevBal - freshBal },
      });
    } else {
      const msg = `New tuition invoice or fee assessment recorded. Outstanding: UGX ${newBalFormatted}.`;
      events.push({
        type: 'FINANCE',
        category: 'fee_balance_change',
        severity: 'warning',
        title: '📋 Fee Ledger Updated',
        message: msg,
        body: msg,
        deepLink: '/profile',
        routeHint: 'profile',
        detectedAt: now,
        meta: { prevBalance: prevBal, newBalance: freshBal, invoiceDelta: freshBal - prevBal },
      });
    }
  }

  return events;
}

// ── 3. Main Exported Diff Engine ───────────────────────────────────────────

/**
 * detectPortalChanges
 *
 * Compares two snapshots and returns an array of structured change events.
 * Returns an empty array if records are identical.
 */
export function detectPortalChanges(
  previousRecord: PortalSnapshot,
  freshRecord: PortalSnapshot
): PortalChangeEvent[] {
  const events: PortalChangeEvent[] = [];

  // Academic metrics & course modules
  events.push(...diffAcademicAndCourses(previousRecord, freshRecord));

  // Tuition & fee ledger
  events.push(...diffFeeLedger(previousRecord, freshRecord));

  return events;
}

/**
 * formatPushPayload
 * Converts a PortalChangeEvent into a native Web Push notification payload.
 */
export function formatPushPayload(event: PortalChangeEvent) {
  return {
    title: event.title,
    body: event.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `portal-${event.type.toLowerCase()}-${event.courseCode || 'gen'}-${Date.now()}`,
    data: {
      routeHint: event.routeHint,
      deepLink: event.deepLink,
      type: event.type,
      severity: event.severity,
      category: event.category,
      courseCode: event.courseCode,
      url: event.deepLink,
    },
    actions: [
      { action: 'open', title: 'Open CourseMate' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
}
