import { Course, ScheduleEvent } from '../types';

/**
 * Format date string (YYYY-MM-DD) and time string (HH:mm) into iCalendar DTSTART / DTEND format (YYYYMMDDTHHMMSS).
 */
function formatIcsDateTime(dateStr: string, timeStr?: string, defaultHour = 9): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    const hh = String(defaultHour).padStart(2, '0');
    return `${cleanDate}T${hh}0000`;
  }

  // Handle time format like "09:00", "14:30", or "09:00 - 12:00"
  const firstTime = timeStr.includes(' - ') ? timeStr.split(' - ')[0].trim() : timeStr.trim();
  const parts = firstTime.split(':');
  const hh = parts[0]?.padStart(2, '0') || '09';
  const mm = parts[1]?.padStart(2, '0') || '00';

  return `${cleanDate}T${hh}${mm}00`;
}

/**
 * Clean text for iCalendar fields (escaping backslashes, semicolons, commas, and newlines).
 */
function cleanIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Export enrolled course exams, timetable lectures, and scheduled deadlines to standard .ics file.
 */
export function exportScheduleToIcs(
  courses: Course[],
  events: ScheduleEvent[],
  studentName = 'Student'
): { success: boolean; eventCount: number; fileName: string } {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourseMate//Academic Command Center//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CourseMate Academic Schedule',
    'X-WR-TIMEZONE:Africa/Kampala',
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const exportedUids = new Set<string>();
  let eventCount = 0;

  // 1. Export all events from Planner / Timetable
  events.forEach((ev) => {
    const uid = `cm-${ev.id}-${ev.courseCode}@coursemate.ug`;
    exportedUids.add(uid);
    eventCount++;

    const dtStart = formatIcsDateTime(ev.date, ev.startTime || '09:00', 9);
    const dtEnd = formatIcsDateTime(ev.date, ev.endTime || '12:00', 12);

    const summary = cleanIcsText(`[${ev.courseCode}] ${ev.title}`);
    const location = cleanIcsText(ev.location || 'University Campus');
    const description = cleanIcsText(
      `Course: ${ev.courseName || ev.courseCode}\nType: ${ev.type.toUpperCase()}\nLocation: ${ev.location || 'Main Campus'}\nNotes: ${ev.notes || 'CourseMate Academic Schedule'}\nSource: ${ev.source?.label || 'CourseMate Portal'}`
    );

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  });

  // 2. Export course examination dates if not already present in events
  courses.forEach((c) => {
    if (c.timetable?.examDate && c.timetable.examDate !== 'Not Yet Scheduled') {
      const examUid = `cm-exam-${c.code.toLowerCase()}@coursemate.ug`;
      if (!exportedUids.has(examUid)) {
        exportedUids.add(examUid);
        eventCount++;

        const examDate = '2026-09-30'; // default current semester examination window
        const examTime = c.timetable.examTime || '14:30 - 17:30';
        const startStr = examTime.includes(' - ') ? examTime.split(' - ')[0] : '14:30';
        const endStr = examTime.includes(' - ') ? examTime.split(' - ')[1] : '17:30';

        const dtStart = formatIcsDateTime(examDate, startStr, 14);
        const dtEnd = formatIcsDateTime(examDate, endStr, 17);

        lines.push(
          'BEGIN:VEVENT',
          `UID:${examUid}`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${cleanIcsText(`[${c.code}] Final Examination: ${c.name}`)}`,
          `DESCRIPTION:${cleanIcsText(`Official University Examination\nCourse: ${c.code} - ${c.name}\nLecturer: ${c.lecturer}\nCredits: ${c.creditUnits || c.credits || 3}`)}`,
          `LOCATION:${cleanIcsText(c.room || 'University Examination Hall')}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        );
      }
    }
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const safeName = studentName.trim().replace(/\s+/g, '_') || 'Student';
  const fileName = `${safeName}_Academic_Schedule.ics`;

  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, eventCount, fileName };
  } catch (err) {
    console.error('Failed to trigger .ics download:', err);
    return { success: false, eventCount, fileName };
  }
}
