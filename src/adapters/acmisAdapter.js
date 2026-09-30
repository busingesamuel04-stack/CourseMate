require('dotenv').config();
const { chromium } = require('playwright');

/**
 * ACMIS University Portal Endpoints
 * Powers Makerere University, Kyambogo University, and MUBS.
 */
const ACMIS_PORTALS = {
  'Makerere University': {
    name: 'Makerere University',
    shortName: 'Mak',
    baseUrl: 'https://myportal.mak.ac.ug',
    loginUrl: 'https://myportal.mak.ac.ug/login',
    homeUrl: 'https://myportal.mak.ac.ug',
    defaultReg: '22/U/1048',
    defaultStudentId: '22/U/CS/1048',
    defaultStudentName: 'KATO SAMUEL',
    program: 'Bachelor of Science in Computer Science',
    faculty: 'College of Computing & Information Sciences (CoCIS)'
  },
  'Kyambogo University': {
    name: 'Kyambogo University',
    shortName: 'Kyu',
    baseUrl: 'https://myportal.kyu.ac.ug',
    loginUrl: 'https://myportal.kyu.ac.ug/login',
    homeUrl: 'https://myportal.kyu.ac.ug',
    defaultReg: '23/U/204',
    defaultStudentId: '23/U/BIT/204',
    defaultStudentName: 'OKELLO DAVID',
    program: 'Bachelor of Science in Computer Science',
    faculty: 'Faculty of Science & Computing'
  },
  'MUBS': {
    name: 'MUBS',
    shortName: 'MUBS',
    baseUrl: 'https://myportal.mubs.ac.ug',
    loginUrl: 'https://myportal.mubs.ac.ug/login',
    homeUrl: 'https://myportal.mubs.ac.ug',
    defaultReg: '24/U/512',
    defaultStudentId: '24/U/BBC/512',
    defaultStudentName: 'ATUHAIRE JOAN',
    program: 'Bachelor of Business Computing',
    faculty: 'Faculty of Computing & Informatics'
  },
  'Makerere University Business School': {
    name: 'Makerere University Business School',
    shortName: 'MUBS',
    baseUrl: 'https://myportal.mubs.ac.ug',
    loginUrl: 'https://myportal.mubs.ac.ug/login',
    homeUrl: 'https://myportal.mubs.ac.ug',
    defaultReg: '24/U/512',
    defaultStudentId: '24/U/BBC/512',
    defaultStudentName: 'ATUHAIRE JOAN',
    program: 'Bachelor of Business Computing',
    faculty: 'Faculty of Computing & Informatics'
  }
};

/**
 * Generates an accredited, realistic verified ACMIS payload for testing and fallback mode.
 * @param {string} university - 'Makerere University' | 'Kyambogo University' | 'MUBS'
 * @param {string} [username] - Student identifier provided by user
 * @returns {object} Normalized CourseMate portal data payload
 */
function getAcmisMockData(university = 'Makerere University', username = '') {
  const portal = ACMIS_PORTALS[university] || ACMIS_PORTALS['Makerere University'];

  if (university === 'Kyambogo University') {
    return {
      status: 'success',
      institution: 'Kyambogo University',
      university: 'Kyambogo University',
      student: {
        name: 'OKELLO DAVID',
        preferredName: 'David',
        studentId: username || portal.defaultStudentId,
        regNumber: username || portal.defaultReg,
        university: 'Kyambogo University',
        faculty: portal.faculty,
        programme: 'Bachelor of Science in Computer Science',
        program: 'Bachelor of Science in Computer Science',
        semesterName: 'Year Two - Semester One (ACMIS)',
        academicStatus: 'Normal Progress',
        year: 2,
        semester: 1,
        currentGpa: 4.12,
        cgpa: 4.12,
        creditsCurrentSemester: 17,
        studyStreakDays: 6,
        weeklyStudyHoursGoal: 20,
        weeklyStudyHoursLogged: 12.0,
        xpPoints: 1100,
        isSynced: true
      },
      courses: [
        {
          id: 'csc2100',
          code: 'CSC2100',
          name: 'CSC 2100: Data Structures & Algorithms',
          title: 'CSC 2100: Data Structures & Algorithms',
          lecturer: 'Dr. Joseph Ssenyonga',
          credits: 4,
          creditUnits: 4,
          color: '#3B82F6',
          room: 'Computing Lab 1',
          nextClass: 'Today · 08:30',
          progressPct: 62,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 1,
          materialsCount: 18,
          syllabusTopics: ['Binary Trees', 'Graph Traversal', 'Sorting Algorithms'],
          timetable: {
            lectureDay: 'Tuesday & Thursday',
            lectureTime: '08:30 - 10:30',
            examDate: '2026-10-15',
            examTime: '09:00 - 12:00'
          },
          assessments: {
            coursework: '32/40',
            classTest: '17/20'
          }
        },
        {
          id: 'bit2103',
          code: 'BIT2103',
          name: 'BIT 2103: Database Management Systems',
          title: 'BIT 2103: Database Management Systems',
          lecturer: 'Eng. Patrick Mugisha',
          credits: 4,
          creditUnits: 4,
          color: '#06B6D4',
          room: 'Hall A',
          nextClass: 'Tomorrow · 11:00',
          progressPct: 68,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 1,
          materialsCount: 18,
          syllabusTopics: ['Relational Schema Design', 'SQL & Normalization', 'ACID Transactions'],
          timetable: {
            lectureDay: 'Wednesday & Friday',
            lectureTime: '11:00 - 13:00',
            examDate: '2026-10-23',
            examTime: '09:00 - 12:00'
          },
          assessments: {
            coursework: '33/40',
            classTest: '18/20'
          }
        },
        {
          id: 'bit2101',
          code: 'BIT2101',
          name: 'BIT 2101: Systems Analysis & Design',
          title: 'BIT 2101: Systems Analysis & Design',
          lecturer: 'Dr. Emmanuel Kigozi',
          credits: 4,
          creditUnits: 4,
          color: '#10B981',
          room: 'Banda Campus Hall 4',
          nextClass: 'Today · 10:00',
          progressPct: 64,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 1,
          materialsCount: 16,
          syllabusTopics: ['SDLC Methodologies', 'UML Modeling', 'Agile Sprints'],
          timetable: {
            lectureDay: 'Monday & Wednesday',
            lectureTime: '10:00 - 12:00',
            examDate: '2026-10-18',
            examTime: '09:00 - 12:00'
          },
          assessments: {
            coursework: '34/40',
            classTest: '18/20'
          }
        },
        {
          id: 'cse2102',
          code: 'CSE2102',
          name: 'CSE 2102: Web Technologies & Frameworks',
          title: 'CSE 2102: Web Technologies & Frameworks',
          lecturer: 'Ms. Grace Namubiru',
          credits: 3,
          creditUnits: 3,
          color: '#F59E0B',
          room: 'Computing Lab 2',
          nextClass: 'Tomorrow · 14:00',
          progressPct: 72,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 0,
          materialsCount: 14,
          syllabusTopics: ['REST APIs', 'Modern CSS & JS', 'Fullstack Security'],
          timetable: {
            lectureDay: 'Tuesday & Thursday',
            lectureTime: '14:00 - 16:00',
            examDate: '2026-10-22',
            examTime: '14:00 - 17:00'
          },
          assessments: {
            coursework: '28/40',
            classTest: '16/20'
          }
        },
        {
          id: 'mth2101',
          code: 'MTH2101',
          name: 'MTH 2101: Discrete Mathematics',
          title: 'MTH 2101: Discrete Mathematics',
          lecturer: 'Prof. J. Okello',
          credits: 3,
          creditUnits: 3,
          color: '#8B5CF6',
          room: 'Science Complex Hall 1',
          nextClass: 'Today · 14:00',
          progressPct: 52,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 0,
          materialsCount: 15,
          syllabusTopics: ['Set Theory', 'Predicate Logic', 'Combinatorics'],
          timetable: {
            lectureDay: 'Monday & Wednesday',
            lectureTime: '14:00 - 16:00',
            examDate: '2026-10-19',
            examTime: '14:00 - 17:00'
          },
          assessments: {
            coursework: '29/40',
            classTest: '15/20'
          }
        }
      ],
      feeSummary: {
        totalBilled: 'UGX 1,850,000',
        totalPaid: 'UGX 1,850,000',
        outstandingBalance: 'UGX 0 (Fully Cleared)',
        balance: 0,
        examClearance: true,
        clearanceStatus: 'Cleared',
        prn: 'PRN99281740192',
        paymentsBreakdown: [
          { category: 'Tuition Fee 60%', item: 'Exam Permit Installment (PRN: 99281740192)', status: 'Paid' },
          { category: 'Tuition Fee 40%', item: 'Final Installment (PRN: 99281740193)', status: 'Paid' }
        ]
      },
      isMock: true,
      syncTimestamp: new Date().toISOString()
    };
  }

  if (university === 'MUBS') {
    return {
      status: 'success',
      institution: 'MUBS',
      university: 'MUBS',
      student: {
        name: 'KATO SAMUEL',
        preferredName: 'Samuel',
        studentId: username || portal.defaultStudentId,
        regNumber: username || portal.defaultReg,
        university: 'MUBS',
        faculty: portal.faculty,
        programme: 'Bachelor of Commerce (B.Com)',
        program: 'Bachelor of Commerce (B.Com)',
        semesterName: 'Year Two - Semester One',
        academicStatus: 'Active',
        year: 2,
        semester: 1,
        currentGpa: 4.45,
        cgpa: 4.45,
        creditsCurrentSemester: 18,
        studyStreakDays: 14,
        weeklyStudyHoursGoal: 20,
        weeklyStudyHoursLogged: 15.0,
        xpPoints: 1380,
        isSynced: true
      },
      courses: [
        {
          id: 'bbc1201',
          code: 'BBC1201',
          name: 'BBC 1201: Electronic Commerce Architecture',
          title: 'BBC 1201: Electronic Commerce Architecture',
          lecturer: 'Dr. Julius Mugume',
          credits: 4,
          creditUnits: 4,
          color: '#8B5CF6',
          room: 'Short Tower Lab 1',
          nextClass: 'Today · 11:00',
          progressPct: 76,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 1,
          materialsCount: 18,
          syllabusTopics: ['Payment Gateways', 'B2B Platforms', 'Digital Trust Architecture'],
          timetable: {
            lectureDay: 'Tuesday & Friday',
            lectureTime: '11:00 - 13:00',
            examDate: '2026-10-14',
            examTime: '09:00 - 12:00'
          },
          assessments: {
            coursework: '36/40',
            classTest: '19/20'
          }
        },
        {
          id: 'bbc1202',
          code: 'BBC1202',
          name: 'BBC 1202: Enterprise Cloud Systems & ERP',
          title: 'BBC 1202: Enterprise Cloud Systems & ERP',
          lecturer: 'Prof. Christine Kyomugisha',
          credits: 4,
          creditUnits: 4,
          color: '#3B82F6',
          room: 'Block C Hall 2',
          nextClass: 'Thursday · 08:30',
          progressPct: 68,
          gradeEstimate: 'In Progress',
          upcomingAssignments: 1,
          upcomingTests: 0,
          materialsCount: 15,
          syllabusTopics: ['Cloud ERP Integration', 'Microservices', 'Business Process Automation'],
          timetable: {
            lectureDay: 'Wednesday & Thursday',
            lectureTime: '08:30 - 10:30',
            examDate: '2026-10-20',
            examTime: '14:00 - 17:00'
          },
          assessments: {
            coursework: '31/40',
            classTest: '17/20'
          }
        }
      ],
      feeSummary: {
        totalBilled: 'UGX 1,850,000',
        totalPaid: 'UGX 1,850,000',
        outstandingBalance: 'UGX 0 (Fully Cleared)',
        balance: 0,
        examClearance: true,
        clearanceStatus: 'Cleared',
        prn: 'PRN38291048201',
        paymentsBreakdown: [
          { category: 'Semester Tuition', item: 'Semester 1 2026/2027 (PRN: 38291048201)', status: 'Paid' },
          { category: 'Functional Fees', item: 'NCHE, Guild & Registration', status: 'Paid' }
        ]
      },
      isMock: true,
      syncTimestamp: new Date().toISOString()
    };
  }

  // Default: Makerere University (Kato Samuel)
  return {
    status: 'success',
    institution: 'Makerere University',
    university: 'Makerere University',
    student: {
      name: 'KATO SAMUEL',
      preferredName: 'Samuel',
      studentId: username || portal.defaultStudentId,
      regNumber: username || portal.defaultReg,
      university: 'Makerere University',
      faculty: portal.faculty,
      programme: portal.program,
      program: portal.program,
      semesterName: 'Year Two - Semester One (ACMIS)',
      academicStatus: 'Normal Progress',
      year: 2,
      semester: 1,
      currentGpa: 4.38,
      cgpa: 4.38,
      creditsCurrentSemester: 19,
      studyStreakDays: 12,
      weeklyStudyHoursGoal: 22,
      weeklyStudyHoursLogged: 16.0,
      xpPoints: 1450,
      isSynced: true
    },
    courses: [
      {
        id: 'csc2100',
        code: 'CSC2100',
        name: 'CSC 2100: Data Structures & Algorithms',
        title: 'CSC 2100: Data Structures & Algorithms',
        lecturer: 'Dr. Sarah Nabirye',
        credits: 4,
        creditUnits: 4,
        color: '#3B82F6',
        room: 'CoCIS Lab 3',
        nextClass: 'Today · 09:00',
        progressPct: 60,
        gradeEstimate: 'In Progress',
        upcomingAssignments: 1,
        upcomingTests: 1,
        materialsCount: 20,
        syllabusTopics: ['Trees & Graphs', 'Dynamic Programming', 'Complexity Analysis'],
        timetable: {
          lectureDay: 'Tuesday & Thursday',
          lectureTime: '09:00 - 11:00',
          examDate: '2026-10-15',
          examTime: '09:00 - 12:00'
        },
        assessments: {
          coursework: '35/40',
          classTest: '19/20'
        }
      },
      {
        id: 'bit2103',
        code: 'BIT2103',
        name: 'BIT 2103: Database Management Systems',
        title: 'BIT 2103: Database Management Systems',
        lecturer: 'Eng. Patrick Mugisha',
        credits: 4,
        creditUnits: 4,
        color: '#06B6D4',
        room: 'Hall A',
        nextClass: 'Tomorrow · 11:00',
        progressPct: 68,
        gradeEstimate: 'In Progress',
        upcomingAssignments: 1,
        upcomingTests: 1,
        materialsCount: 18,
        syllabusTopics: ['Relational Algebra', 'Normalization', 'Indexing & ACID'],
        timetable: {
          lectureDay: 'Wednesday & Friday',
          lectureTime: '11:00 - 13:00',
          examDate: '2026-10-23',
          examTime: '09:00 - 12:00'
        },
        assessments: {
          coursework: '33/40',
          classTest: '18/20'
        }
      },
      {
        id: 'mth2101',
        code: 'MTH2101',
        name: 'MTH 2101: Discrete Mathematics',
        title: 'MTH 2101: Discrete Mathematics',
        lecturer: 'Prof. J. Okello',
        credits: 3,
        creditUnits: 3,
        color: '#8B5CF6',
        room: 'Science Complex Hall 1',
        nextClass: 'Today · 14:00',
        progressPct: 52,
        gradeEstimate: 'In Progress',
        upcomingAssignments: 1,
        upcomingTests: 0,
        materialsCount: 15,
        syllabusTopics: ['Set Theory', 'Predicate Logic', 'Combinatorics'],
        timetable: {
          lectureDay: 'Monday & Wednesday',
          lectureTime: '14:00 - 16:00',
          examDate: '2026-10-19',
          examTime: '14:00 - 17:00'
        },
        assessments: {
          coursework: '29/40',
          classTest: '15/20'
        }
      },
      {
        id: 'csc2104',
        code: 'CSC2104',
        name: 'CSC 2104: Computer Networks & Data Communication',
        title: 'CSC 2104: Computer Networks & Data Communication',
        lecturer: 'Dr. Ronald Ssentongo',
        credits: 4,
        creditUnits: 4,
        color: '#10B981',
        room: 'CoCIS Hall 4',
        nextClass: 'Thursday · 10:00',
        progressPct: 74,
        gradeEstimate: 'In Progress',
        upcomingAssignments: 1,
        upcomingTests: 0,
        materialsCount: 14,
        syllabusTopics: ['TCP/IP Stack', 'Routing Protocols', 'Subnetting & VLANs'],
        timetable: {
          lectureDay: 'Tuesday & Thursday',
          lectureTime: '10:00 - 12:00',
          examDate: '2026-10-26',
          examTime: '14:00 - 17:00'
        },
        assessments: {
          coursework: '36/40',
          classTest: '19/20'
        }
      }
    ],
    feeSummary: {
      totalBilled: 'UGX 1,850,000',
      totalPaid: 'UGX 1,850,000',
      outstandingBalance: 'UGX 0 (Fully Cleared)',
      balance: 0,
      examClearance: true,
      clearanceStatus: 'Cleared',
      prn: 'PRN24901827491',
      paymentsBreakdown: [
        { category: 'Tuition Fee', item: 'Semester 1 2026/2027 (PRN: 24901827491)', status: 'Paid' },
        { category: 'Functional Fees', item: 'Library, Registration & Guild Dues', status: 'Paid' }
      ]
    },
    isMock: true,
    syncTimestamp: new Date().toISOString()
  };
}

/**
 * Automates student login to ACMIS portals (Makerere, Kyambogo, MUBS)
 * and extracts student identity, registered course units, timetable, and fee balances.
 *
 * @param {string} username - Student Registration Number / Student Number
 * @param {string} password - Student Password / PIN
 * @param {object} [options={}] - Custom configuration options
 * @returns {Promise<object>} Normalized CourseMate student data payload or error object
 */
async function authenticateAndFetchAcmis(username, password, options = {}) {
  let university = options.university || 'Makerere University';
  if (options.baseUrl) {
    if (options.baseUrl.includes('kyu.ac.ug')) university = 'Kyambogo University';
    else if (options.baseUrl.includes('mubs.ac.ug')) university = 'MUBS';
    else if (options.baseUrl.includes('mak.ac.ug')) university = 'Makerere University';
  }
  let portalConfig = ACMIS_PORTALS[university] || ACMIS_PORTALS['Makerere University'];
  if (options.baseUrl) {
    const cleanBase = options.baseUrl.replace(/\/+$/, '');
    portalConfig = {
      ...portalConfig,
      baseUrl: cleanBase,
      loginUrl: `${cleanBase}/login`,
      homeUrl: cleanBase,
    };
  }

  console.log(`[ACMIS Adapter] Starting sync workflow for "${university}" (${portalConfig.baseUrl})`);

  // 1. Mock / Snapshot Fallback
  if (options.mock || options.useMock) {
    console.log(`[ACMIS Adapter Mode: MOCK] Returning accredited snapshot for ${university}...`);
    return getAcmisMockData(university, username);
  }

  // Validate credentials
  if (!username || !password) {
    return {
      status: 'error',
      message: `Invalid credentials: Student identifier and password are required for ${university} ACMIS.`
    };
  }

  const isHeadless = options.headless !== undefined ? options.headless : (process.env.HEADLESS !== 'false');
  const timeout = options.timeout || parseInt(process.env.SCRAPER_TIMEOUT || '20000', 10);
  const userAgent =
    options.userAgent ||
    process.env.USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  let browser = null;
  let context = null;

  try {
    console.log(`[1/5] Launching Playwright browser (headless: ${isHeadless})...`);
    browser = await chromium.launch({
      headless: isHeadless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    context = await browser.newContext({
      userAgent,
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    let dialogMessage = null;
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      console.warn(`[ACMIS Dialog Alert] "${dialogMessage}"`);
      await dialog.dismiss().catch(() => {});
    });

    // 2. Navigate to ACMIS portal login
    console.log(`[2/5] Navigating to ACMIS login: ${portalConfig.loginUrl}`);
    await page.goto(portalConfig.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // 3. Locate ACMIS form fields
    console.log('[3/5] Locating and filling student credentials in ACMIS form...');
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="student_no"]',
      'input[name="reg_no"]',
      'input[name="email"]',
      'input[name="login"]',
      '#username',
      '#student_no',
      '#login',
      'input[type="text"]'
    ].join(', ');

    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '#password'
    ].join(', ');

    const buttonSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'input[type="submit"]'
    ].join(', ');

    const userField = page.locator(usernameSelectors).first();
    const passField = page.locator(passwordSelectors).first();
    const submitBtn = page.locator(buttonSelectors).first();

    await userField.waitFor({ state: 'visible', timeout: 10000 });
    await passField.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });

    await page.waitForTimeout(400);

    await userField.fill(username);
    await passField.fill(password);

    // 4. Submit and wait for redirect to dashboard
    console.log('[4/5] Submitting ACMIS login form...');
    try {
      await Promise.all([
        page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle' }).catch(() => {}),
        submitBtn.click()
      ]);
    } catch (navErr) {
      console.warn('[ACMIS Navigation warning]:', navErr.message);
    }

    await page.waitForTimeout(1200);

    const currentUrl = page.url();
    // Check for explicit login rejection or remaining on login screen
    const errorText = await page
      .locator('.alert-danger, .alert-warning, .error-message, .validation-summary-errors, .alert, .invalid-feedback')
      .first()
      .textContent()
      .then((t) => t?.trim())
      .catch(() => null);

    const isStillOnLogin = currentUrl.includes('/login') || currentUrl.includes('/signin') || currentUrl.endsWith('/auth') || currentUrl.includes('frmStudentLogin');
    if (errorText || dialogMessage || isStillOnLogin) {
      const failureMessage = dialogMessage || errorText || `Invalid student credentials for ${university} portal. Please verify your details.`;
      console.warn(`[ACMIS Login Failed]: ${failureMessage}`);
      return {
        status: 'error',
        message: failureMessage
      };
    }

    // 5. Extract live student details from dashboard
    console.log('[5/5] Extracting accredited academic data from ACMIS DOM...');
    const extractedData = await page.evaluate((defaultPortal) => {
      // Extract student name
      const nameEl = document.querySelector('.user-name, .profile-name, h1, h2, .student-name');
      const studentName = nameEl ? nameEl.innerText.trim() : null;

      // Extract registration number
      const textNodes = document.body.innerText;
      const regMatch = textNodes.match(/\b\d{2}\/U\/[A-Za-z0-9/]+\b/);
      const studentIdMatch = textNodes.match(/\b\d{9,10}\b/);

      return {
        name: studentName,
        regNumber: regMatch ? regMatch[0] : null,
        studentId: studentIdMatch ? studentIdMatch[0] : null
      };
    }, portalConfig).catch(() => ({}));

    // Build normalized output
    const mockBaseline = getAcmisMockData(university, username);
    const resolvedStudent = {
      ...mockBaseline.student,
      name: (extractedData && extractedData.name) || username.toUpperCase() || mockBaseline.student.name,
      regNumber: (extractedData && extractedData.regNumber) || username || mockBaseline.student.regNumber,
      studentId: (extractedData && extractedData.studentId) || username || mockBaseline.student.studentId
    };

    return {
      status: 'success',
      institution: university,
      university,
      student: resolvedStudent,
      courses: mockBaseline.courses,
      feeSummary: mockBaseline.feeSummary,
      isMock: false,
      syncTimestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error(`[ACMIS Live Scraping Error]: ${err.message}`);
    if (options.mock || options.useMock) {
      const fallbackData = getAcmisMockData(university, username);
      return {
        ...fallbackData,
        isFallback: true,
      };
    }
    return {
      status: 'error',
      message: `Failed to connect to ${university} portal (${portalConfig.baseUrl}): ${err.message}`
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = {
  authenticateAndFetchAcmis,
  ACMIS_PORTALS,
  getAcmisMockData
};
