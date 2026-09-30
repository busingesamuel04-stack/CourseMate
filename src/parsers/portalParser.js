const cheerio = require('cheerio');

/**
 * Normalizes text by removing non-breaking spaces, excessive whitespace,
 * and trimming leading/trailing whitespace.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Splits strings like "HEC1207 - Fundamentals of Business & Management" into code and title.
 * @param {string} raw
 * @returns {{ code: string, title: string }}
 */
function parseCodeAndTitle(raw) {
  const parts = raw.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return {
      code: cleanText(parts[0]),
      title: cleanText(parts.slice(1).join(' - '))
    };
  }
  return {
    code: cleanText(raw),
    title: cleanText(raw)
  };
}

/**
 * Extracts student profile information using both ISMIS specific element IDs
 * and generic resilient patterns.
 * @param {import('cheerio').CheerioAPI} $
 * @returns {{ name: string, regNumber: string, program: string, semester?: string, academicStatus?: string }}
 */
function extractStudentProfile($) {
  // ISMIS direct elements
  let name = cleanText($('#lblName').text()) || cleanText($('span[id*="Name"]').text());
  let program = cleanText($('#lblProgram').text()) || cleanText($('span[id*="Program"]').text());
  let semester = cleanText($('#lblSem').text()) || cleanText($('span[id*="Sem"]').text());
  let status = cleanText($('#lblStatus').text());

  let regNumber = '';
  // Check if batch/reg is in semester string, e.g. "Year One - Semester Two (HECS26DA)"
  const batchMatch = semester.match(/\(([^)]+)\)/);
  if (batchMatch) {
    regNumber = batchMatch[1].trim();
  }

  // Generic fallback if not matched yet
  if (!name || !regNumber || !program) {
    $('span, label, div').each((_, el) => {
      const id = $(el).attr('id') || '';
      const text = cleanText($(el).text());
      if (!text) return;

      if (!name && /lbl.*(student.*name|studentname|studname)/i.test(id)) {
        name = text;
      } else if (!regNumber && /lbl.*(reg.*no|roll.*no|registration|studentid)/i.test(id)) {
        regNumber = text;
      } else if (!program && /lbl.*(program|course|department|degree)/i.test(id)) {
        program = text;
      }
    });
  }

  return {
    name: name || 'N/A',
    regNumber: regNumber || 'N/A',
    program: program || 'N/A',
    semester: semester || 'N/A',
    academicStatus: status || 'N/A'
  };
}

/**
 * Extracts student fee summary (Billed, Paid, Outstanding Balance).
 * Handles ISMIS NCHE/GUILD payment grids as well as standard ledger cards.
 * @param {import('cheerio').CheerioAPI} $
 * @returns {{ totalBilled: string, totalPaid: string, outstandingBalance: string, paymentsBreakdown?: Array<object> }}
 */
function extractFeeSummary($) {
  let totalBilled = '';
  let totalPaid = '';
  let outstandingBalance = '';
  const paymentsBreakdown = [];

  // 1. Check ISMIS gvNCHE & gvGUILD tables
  if ($('#gvNCHE, #gvGUILD').length > 0) {
    let nchePaid = 0, ncheTotal = 0;
    let guildPaid = 0, guildDue = 0;
    const dueItems = [];

    $('#gvNCHE tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        ncheTotal++;
        const item = cleanText($(cells[1]).text());
        const status = cleanText($(cells[2]).text());
        if (/paid/i.test(status)) nchePaid++;
        paymentsBreakdown.push({ category: 'NCHE Payment', item, status });
      }
    });

    $('#gvGUILD tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const item = cleanText($(cells[1]).text());
        const status = cleanText($(cells[2]).text());
        if (/paid/i.test(status)) guildPaid++;
        if (/due/i.test(status)) {
          guildDue++;
          dueItems.push(`GUILD: ${item}`);
        }
        paymentsBreakdown.push({ category: 'GUILD Payment', item, status });
      }
    });

    if (paymentsBreakdown.length > 0) {
      totalBilled = `NCHE (${ncheTotal} terms), GUILD (${guildPaid + guildDue} terms)`;
      totalPaid = `NCHE (${nchePaid}/${ncheTotal} Paid), GUILD (${guildPaid} Paid)`;
      outstandingBalance = dueItems.length > 0 ? dueItems.join(', ') + ' (Due)' : '0.00';

      return {
        totalBilled,
        totalPaid,
        outstandingBalance,
        paymentsBreakdown
      };
    }
  }

  // 2. Check ASP.NET element IDs for fee fields
  $('span, label, td, div').each((_, el) => {
    const id = $(el).attr('id') || '';
    const text = cleanText($(el).text());
    if (!text) return;

    if (!totalBilled && /lbl.*(total.*bill|billed.*amount|total.*fee|debit)/i.test(id)) {
      totalBilled = text;
    } else if (!totalPaid && /lbl.*(total.*paid|paid.*amount|received|credit)/i.test(id)) {
      totalPaid = text;
    } else if (!outstandingBalance && /lbl.*(balance|outstanding|due.*amount)/i.test(id)) {
      outstandingBalance = text;
    }
  });

  // 3. Pattern matching in summary cards or tables
  const moneyPattern = /(?:UGX|USD|shs\.?|USh|[\$€£])?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i;

  $('tr, div, p').each((_, el) => {
    const line = cleanText($(el).text());
    if (!line) return;

    if (!totalBilled && /total\s*(?:billed|invoiced|fees?|payable)/i.test(line)) {
      const match = line.match(new RegExp('(?:total\\s*(?:billed|invoiced|fees?|payable))\\s*[:\\-]?\\s*' + moneyPattern.source, 'i'));
      if (match) totalBilled = match[1] || match[0];
    }

    if (!totalPaid && /total\s*(?:paid|receipts?|cleared)|amount\s*paid/i.test(line)) {
      const match = line.match(new RegExp('(?:total\\s*(?:paid|receipts?|cleared)|amount\\s*paid)\\s*[:\\-]?\\s*' + moneyPattern.source, 'i'));
      if (match) totalPaid = match[1] || match[0];
    }

    if (!outstandingBalance && /(?:outstanding\s*balance|fee\s*balance|balance\s*due|net\s*balance|due\s*amount)/i.test(line)) {
      const match = line.match(new RegExp('(?:outstanding\\s*balance|fee\\s*balance|balance\\s*due|net\\s*balance|due\\s*amount)\\s*[:\\-]?\\s*' + moneyPattern.source, 'i'));
      if (match) outstandingBalance = match[1] || match[0];
    }
  });

  return {
    totalBilled: totalBilled || '0.00',
    totalPaid: totalPaid || '0.00',
    outstandingBalance: outstandingBalance || '0.00'
  };
}

/**
 * Extracts course units / registered courses / timetable from ISMIS tables
 * (gvUE, gvCW, gvMidExam) or standard GridViews.
 * @param {import('cheerio').CheerioAPI} $
 * @returns {Array<{ code: string, title: string, creditUnits: number, grade: string, timetable?: object, assessments?: object }>}
 */
function extractCourses($) {
  // Case A: ISMIS Dashboard tables (gvUE, gvCW, gvMidExam)
  if ($('#gvUE, #gvCW, #gvMidExam').length > 0) {
    const coursesMap = new Map();

    const getOrCreate = (raw) => {
      const { code, title } = parseCodeAndTitle(raw);
      if (!coursesMap.has(code)) {
        coursesMap.set(code, {
          code,
          title,
          creditUnits: 3.0,
          grade: 'In Progress',
          timetable: { examDate: 'Not Yet Scheduled', examTime: 'N/A' },
          assessments: { coursework: 'Pending', classTest: 'Pending' }
        });
      }
      return coursesMap.get(code);
    };

    // Exam Timetable (gvUE)
    $('#gvUE tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const raw = cleanText($(cells[1]).text());
        const date = cleanText($(cells[2]).text());
        const time = cells.length >= 4 ? cleanText($(cells[3]).text()) : '';
        if (raw) {
          const c = getOrCreate(raw);
          c.timetable = { examDate: date || 'Not Yet Scheduled', examTime: time || 'N/A' };
        }
      }
    });

    // Course Work (gvCW)
    $('#gvCW tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const raw = cleanText($(cells[1]).text());
        const status = cleanText($(cells[2]).text());
        if (raw) getOrCreate(raw).assessments.coursework = status || 'Pending';
      }
    });

    // Class Test (gvMidExam)
    $('#gvMidExam tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const raw = cleanText($(cells[1]).text());
        const status = cleanText($(cells[2]).text());
        if (raw) getOrCreate(raw).assessments.classTest = status || 'Pending';
      }
    });

    return Array.from(coursesMap.values());
  }

  // Case B: Generic Table GridView parsing
  const courses = [];
  $('table').each((_, tableEl) => {
    const $table = $(tableEl);
    const rows = $table.find('tr');
    if (rows.length < 2) return;

    let colIndices = { code: -1, title: -1, creditUnits: -1, grade: -1 };
    let headerRowIndex = -1;

    rows.each((rIdx, rEl) => {
      if (headerRowIndex !== -1) return;
      const cells = $(rEl).find('th, td');
      let foundCode = -1, foundTitle = -1, foundCu = -1, foundGrade = -1;

      cells.each((cIdx, cEl) => {
        const text = cleanText($(cEl).text()).toLowerCase();
        if (/^(course\s*code|sub(?:ject)?\s*code|code)$/i.test(text) || (/code/i.test(text) && !/bar/i.test(text))) {
          foundCode = cIdx;
        } else if (/^(course\s*title|course\s*name|subject(?:\s*name)?|paper|module|title)$/i.test(text) || /title|subject/i.test(text)) {
          foundTitle = cIdx;
        } else if (/^(credit\s*units?|credits?|c\.?u\.?|units?|cu|weight)$/i.test(text) || /credit/i.test(text)) {
          foundCu = cIdx;
        } else if (/^(grade|marks?|result|score|status|letter\s*grade)$/i.test(text) || /grade/i.test(text)) {
          foundGrade = cIdx;
        }
      });

      if (foundCode !== -1 && (foundTitle !== -1 || foundCu !== -1)) {
        headerRowIndex = rIdx;
        colIndices = { code: foundCode, title: foundTitle, creditUnits: foundCu, grade: foundGrade };
      }
    });

    if (headerRowIndex === -1) return;

    rows.slice(headerRowIndex + 1).each((_, rEl) => {
      const cells = $(rEl).find('td');
      if (cells.length < 2) return;

      const codeRaw = colIndices.code !== -1 ? $(cells[colIndices.code]).text() : '';
      const titleRaw = colIndices.title !== -1 ? $(cells[colIndices.title]).text() : '';
      const cuRaw = colIndices.creditUnits !== -1 ? $(cells[colIndices.creditUnits]).text() : '';
      const gradeRaw = colIndices.grade !== -1 ? $(cells[colIndices.grade]).text() : '';

      const code = cleanText(codeRaw);
      const title = cleanText(titleRaw);
      const grade = cleanText(gradeRaw);
      const creditParsed = parseFloat(cleanText(cuRaw).replace(/[^\d.]/g, ''));
      const creditUnits = Number.isNaN(creditParsed) ? 0 : creditParsed;

      const isFooterOrSummary = /total|gpa|cgpa|page/i.test(code) || /total/i.test(title);
      if (code && !isFooterOrSummary) {
        courses.push({ code, title: title || 'N/A', creditUnits, grade: grade || 'N/A' });
      }
    });
  });

  return courses;
}

function parsePortalHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return {
      status: 'error',
      student: { name: '', regNumber: '', program: '' },
      feeSummary: { totalBilled: '0.00', totalPaid: '0.00', outstandingBalance: '0.00' },
      courses: [],
      scrapedAt: new Date().toISOString()
    };
  }

  const $ = cheerio.load(htmlString);
  const student = extractStudentProfile($);
  const feeSummary = extractFeeSummary($);
  const courses = extractCourses($);

  return {
    status: 'success',
    student,
    feeSummary,
    courses,
    scrapedAt: new Date().toISOString()
  };
}

module.exports = {
  cleanText,
  parseCodeAndTitle,
  extractStudentProfile,
  extractFeeSummary,
  extractCourses,
  parsePortalHtml
};
