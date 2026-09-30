const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Utility to normalize and clean extracted strings.
 * @param {string} text
 * @returns {string}
 */
function clean(text) {
  if (!text) return '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parses course string like "HEC1207 - Fundamentals of Business & Management"
 * into code and title.
 * @param {string} rawString
 * @returns {{ code: string, title: string }}
 */
function parseCourseCodeAndTitle(rawString) {
  const parts = rawString.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return {
      code: clean(parts[0]),
      title: clean(parts.slice(1).join(' - '))
    };
  }
  return {
    code: clean(rawString),
    title: clean(rawString)
  };
}

function parseStudentPortal(html) {
  const $ = cheerio.load(html);

  // ==========================================
  // 1. Student Profile Extraction
  // ==========================================
  const name = clean($('#lblName').text()) || clean($('span[id*="Name"]').text()) || 'N/A';
  const program = clean($('#lblProgram').text()) || clean($('span[id*="Program"]').text()) || 'N/A';
  const semesterRaw = clean($('#lblSem').text()) || clean($('span[id*="Sem"]').text()) || '';
  const status = clean($('#lblStatus').text()) || 'N/A';
  const notice = clean($('#lblMessage').text()) || '';
  const attendanceTips = clean($('#lblAttTips').text()) || '';

  // Extract batch code if embedded in semester string, e.g. "Year One - Semester Two (HECS26DA)"
  const batchMatch = semesterRaw.match(/\(([^)]+)\)/);
  const batchCode = batchMatch ? batchMatch[1].trim() : 'N/A';

  // Registration number (often represented by the batch or student ID)
  const regNumber = batchCode !== 'N/A' ? batchCode : 'N/A';

  // ==========================================
  // 2. Fee / Payment Summary Extraction
  // ==========================================
  const payments = [];
  let nchePaid = 0;
  let ncheTotal = 0;
  let guildPaid = 0;
  let guildDue = 0;
  const dueItems = [];

  // Parse NCHE Payments Table (gvNCHE)
  $('#gvNCHE tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const itemNumber = clean($(cells[0]).text());
      const semester = clean($(cells[1]).text());
      const payStatus = clean($(cells[2]).text());

      if (itemNumber && semester) {
        ncheTotal++;
        if (/paid/i.test(payStatus)) nchePaid++;
        payments.push({
          category: 'NCHE Payment',
          item: semester,
          status: payStatus
        });
      }
    }
  });

  // Parse GUILD Payments Table (gvGUILD)
  $('#gvGUILD tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const itemNumber = clean($(cells[0]).text());
      const semester = clean($(cells[1]).text());
      const payStatus = clean($(cells[2]).text());

      if (itemNumber && semester) {
        if (/paid/i.test(payStatus)) {
          guildPaid++;
        } else if (/due/i.test(payStatus)) {
          guildDue++;
          dueItems.push(`GUILD: ${semester}`);
        }
        payments.push({
          category: 'GUILD Payment',
          item: semester,
          status: payStatus
        });
      }
    }
  });

  const feeSummary = {
    totalBilled: `NCHE (${ncheTotal} terms), GUILD (${guildPaid + guildDue} terms)`,
    totalPaid: `NCHE (${nchePaid}/${ncheTotal} Paid), GUILD (${guildPaid} Paid)`,
    outstandingBalance: dueItems.length > 0 ? dueItems.join(', ') + ' (Due)' : '0.00 (All Cleared)',
    paymentsBreakdown: payments
  };

  // ==========================================
  // 3. Enrolled Courses & Timetable Extraction
  // ==========================================
  const coursesMap = new Map();

  // Helper to ensure course entry exists in Map
  const getOrCreateCourse = (rawCourse) => {
    const { code, title } = parseCourseCodeAndTitle(rawCourse);
    if (!coursesMap.has(code)) {
      coursesMap.set(code, {
        code,
        title,
        creditUnits: 3.0, // Standard default for diploma/cert modules
        grade: 'In Progress',
        timetable: {
          examDate: 'Not Yet Scheduled',
          examTime: 'N/A'
        },
        assessments: {
          coursework: 'Pending',
          classTest: 'Pending'
        }
      });
    }
    return coursesMap.get(code);
  };

  // A. University Exam Timetable (gvUE)
  $('#gvUE tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const rawCourse = clean($(cells[1]).text());
      const examDate = clean($(cells[2]).text());
      const examTime = cells.length >= 4 ? clean($(cells[3]).text()) : '';

      if (rawCourse) {
        const course = getOrCreateCourse(rawCourse);
        course.timetable = {
          examDate: examDate || 'Not Yet Scheduled',
          examTime: examTime || 'N/A'
        };
      }
    }
  });

  // B. Course Work Status (gvCW)
  $('#gvCW tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const rawCourse = clean($(cells[1]).text());
      const cwStatus = clean($(cells[2]).text());
      if (rawCourse) {
        const course = getOrCreateCourse(rawCourse);
        course.assessments.coursework = cwStatus || 'Pending';
      }
    }
  });

  // C. Class Test Status (gvMidExam)
  $('#gvMidExam tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const rawCourse = clean($(cells[1]).text());
      const midStatus = clean($(cells[2]).text());
      if (rawCourse) {
        const course = getOrCreateCourse(rawCourse);
        course.assessments.classTest = midStatus || 'Pending';
      }
    }
  });

  const courses = Array.from(coursesMap.values());

  return {
    status: 'success',
    student: {
      name,
      regNumber,
      program,
      semester: semesterRaw,
      batchCode,
      academicStatus: status,
      academicNotice: notice,
      attendanceWarning: attendanceTips
    },
    feeSummary,
    courses,
    scrapedAt: new Date().toISOString()
  };
}

function main() {
  const filePath = path.join(__dirname, 'portal.html');

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const result = parseStudentPortal(html);

  console.log(JSON.stringify(result, null, 2));
}

main();
