/**
 * test/watcher_engine.test.js
 * ────────────────────────────────────────────────────────────
 * Verification suite for Portal Watcher & Change Detection Engine.
 */

import { detectPortalChanges, formatPushPayload } from '../src/services/portalWatcher.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

console.log('=== CourseMate Portal Watcher Verification Suite ===\n');

// ── Test 1: Grade & Coursework Change Detection ────────────────────────────
console.log('Test 1: Grade & Coursework Change Detection');
const prevGradeSnap = {
  gpa: 4.10,
  cgpa: 4.05,
  courses: [
    {
      code: 'CS1204',
      title: 'Data Structures & Algorithms',
      courseworkMark: 28,
      courseworkTotal: 40,
      finalMark: null,
      attendancePercent: 85,
    },
  ],
};

const freshGradeSnap = {
  gpa: 4.35,
  cgpa: 4.18,
  courses: [
    {
      code: 'CS1204',
      title: 'Data Structures & Algorithms',
      courseworkMark: 36,
      courseworkTotal: 40,
      finalMark: 82,
      attendancePercent: 72, // Below 75%
    },
  ],
};

const gradeDiffs = detectPortalChanges(prevGradeSnap, freshGradeSnap);
assert(gradeDiffs.length >= 4, `Expected at least 4 diffs, got ${gradeDiffs.length}`);

const gpaDiff = gradeDiffs.find((d) => d.category === 'gpa_update');
assert(gpaDiff && gpaDiff.type === 'GRADE', 'GPA change detected as GRADE');
assert(gpaDiff.severity === 'success', 'GPA improvement marked as success');

const markDiff = gradeDiffs.find((d) => d.category === 'coursework_mark');
assert(markDiff && markDiff.type === 'GRADE', 'Coursework update detected as GRADE');

const resultDiff = gradeDiffs.find((d) => d.category === 'result_released');
assert(resultDiff && resultDiff.type === 'GRADE', 'Final result detected as GRADE');

const attDiff = gradeDiffs.find((d) => d.category === 'attendance_drop');
assert(attDiff && attDiff.severity === 'urgent', 'Low attendance below 75% detected as urgent');
console.log('');

// ── Test 2: Exam Timetable Change Detection ────────────────────────────────
console.log('Test 2: Exam Timetable Change Detection');
const prevExamSnap = {
  courses: [
    {
      code: 'BIT2201',
      title: 'Database Systems Architecture',
      examDate: '2026-10-14',
      examTime: '09:00 AM',
      examVenue: 'Auditorium 1',
    },
    {
      code: 'MTH1102',
      title: 'Calculus II',
      examDate: null,
    },
  ],
};

const freshExamSnap = {
  courses: [
    {
      code: 'BIT2201',
      title: 'Database Systems Architecture',
      examDate: '2026-10-21', // Rescheduled
      examTime: '02:00 PM',   // Time shifted
      examVenue: 'Main Hall Lab 2', // Venue changed
    },
    {
      code: 'MTH1102',
      title: 'Calculus II',
      examDate: '2026-10-28', // Newly scheduled
      examVenue: 'Lecture Room 4',
    },
  ],
};

const examDiffs = detectPortalChanges(prevExamSnap, freshExamSnap);
assert(examDiffs.length >= 3, `Expected at least 3 exam diffs, got ${examDiffs.length}`);

const reschedDiff = examDiffs.find((d) => d.category === 'exam_date_change');
assert(reschedDiff && reschedDiff.type === 'EXAM', 'Exam rescheduled detected as EXAM');
assert(reschedDiff.severity === 'urgent', 'Exam date change is urgent');
assert(reschedDiff.deepLink === '/planner', 'Exam diff deep link points to /planner');

const newExamDiff = examDiffs.find((d) => d.category === 'exam_scheduled');
assert(newExamDiff && newExamDiff.type === 'EXAM', 'Newly scheduled exam detected as EXAM');
console.log('');

// ── Test 3: Tuition & Fee Ledger Change Detection ──────────────────────────
console.log('Test 3: Tuition & Fee Ledger Change Detection');
const prevFeeSnap = {
  feeLedger: {
    totalOwed: 2500000,
    totalPaid: 1000000,
    balance: 1500000,
    isCleared: false,
    examPermitIssued: false,
  },
};

const freshFeeSnap = {
  feeLedger: {
    totalOwed: 2500000,
    totalPaid: 2500000,
    balance: 0,
    isCleared: true,
    examPermitIssued: true,
  },
};

const feeDiffs = detectPortalChanges(prevFeeSnap, freshFeeSnap);
assert(feeDiffs.length >= 3, `Expected 3 fee diffs, got ${feeDiffs.length}`);

const clearDiff = feeDiffs.find((d) => d.category === 'fee_status_change');
assert(clearDiff && clearDiff.type === 'FINANCE', 'Fee clearance detected as FINANCE');
assert(clearDiff.severity === 'success', 'Fee clearance marked as success');

const payDiff = feeDiffs.find((d) => d.category === 'fee_balance_change');
assert(payDiff && payDiff.type === 'FINANCE', 'Payment credited detected as FINANCE');

const permitDiff = feeDiffs.find((d) => d.category === 'exam_permit_issued');
assert(permitDiff && permitDiff.type === 'FINANCE', 'Exam permit issued detected as FINANCE');
assert(permitDiff.deepLink === '/profile', 'Finance diff deep link points to /profile');
console.log('');

// ── Test 4: Course Registration & Enrollment Change Detection ──────────────
console.log('Test 4: Course Registration & Enrollment Change Detection');
const prevEnrollSnap = {
  courses: [
    { code: 'CS101', title: 'Intro to CS', status: 'Pending' },
    { code: 'CS102', title: 'Calculus I', status: 'Approved' },
  ],
};

const freshEnrollSnap = {
  courses: [
    { code: 'CS101', title: 'Intro to CS', status: 'Approved' }, // Status changed to approved
    { code: 'CS103', title: 'Discrete Math', status: 'Approved' }, // New course added
    // CS102 was dropped
  ],
};

const enrollDiffs = detectPortalChanges(prevEnrollSnap, freshEnrollSnap);
assert(enrollDiffs.length === 3, `Expected 3 enrollment diffs, got ${enrollDiffs.length}`);

const approvedDiff = enrollDiffs.find((d) => d.category === 'course_approved');
assert(approvedDiff && approvedDiff.type === 'ENROLLMENT', 'Course approved detected as ENROLLMENT');
assert(approvedDiff.severity === 'success', 'Course approval is success');

const newCourseDiff = enrollDiffs.find((d) => d.category === 'new_course');
assert(newCourseDiff && newCourseDiff.type === 'ENROLLMENT', 'New course detected as ENROLLMENT');

const droppedDiff = enrollDiffs.find((d) => d.category === 'dropped_course');
assert(droppedDiff && droppedDiff.type === 'ENROLLMENT', 'Dropped course detected as ENROLLMENT');
console.log('');

// ── Test 5: formatPushPayload Verification ─────────────────────────────────
console.log('Test 5: formatPushPayload Verification');
const payload = formatPushPayload(reschedDiff);
assert(payload.title === reschedDiff.title, 'Payload title matches diff title');
assert(payload.body === reschedDiff.message, 'Payload body matches diff message');
assert(payload.data.deepLink === '/planner', 'Payload deepLink preserved');
assert(payload.actions && payload.actions.length === 2, 'Action buttons included in push payload');
console.log('\n✅ All 5 Verification Test Suites Passed 100%!');
