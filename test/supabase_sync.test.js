import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';
const MOCK_TOKEN = 'Bearer mock-student-uuid-101';

async function runTests() {
  console.log('\n========================================');
  console.log('🚀 CourseMate Supabase Cloud Sync Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Test 1: Unauthenticated request handling
  await test('GET /api/sync/fetch-user-data returns empty when unauthenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/sync/fetch-user-data`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'empty');
  });

  // Test 2: Persist academic data via POST /api/sync/persist-academic-data
  await test('POST /api/sync/persist-academic-data persists courses, student, and fee summary', async () => {
    const payload = {
      university: 'ISBAT University',
      student: {
        name: 'BUSINGE SAMUEL',
        preferredName: 'Samuel',
        studentId: 'HECS26DA',
        regNumber: 'HECS26DA',
        faculty: 'Faculty of Information & Technology',
        programme: 'Higher Education Certificate in Computing',
        semesterName: 'Year One - Semester Two',
        academicStatus: 'Active',
        currentGpa: 4.25,
        xpPoints: 1490,
      },
      courses: [
        {
          code: 'HEC1207',
          name: 'Fundamentals of Business & Management',
          creditUnits: 4,
          lecturer: 'Dr. Mukasa David',
          room: 'Lab 2 / Main Campus',
          progressPct: 65,
        },
        {
          code: 'HEC1208',
          name: 'Foundational Statistics',
          creditUnits: 3,
          lecturer: 'Dr. Sarah Nabirye',
          room: 'Lab 4 / City Campus',
          progressPct: 80,
        },
      ],
      feeSummary: {
        totalPayable: 2500000,
        totalPaid: 2100000,
        balanceOutstanding: 400000,
        clearanceStatus: 'Cleared for Exam',
      },
      events: [
        {
          id: 'exam-hec1207',
          title: 'HEC1207 Final Exam',
          courseCode: 'HEC1207',
          type: 'exam',
          date: '2026-09-30',
          startTime: '14:30',
          endTime: '17:30',
          location: 'ISBAT Examination Hall',
          completed: false,
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/sync/persist-academic-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: MOCK_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.syncedCount, 2);
  });

  // Test 3: Save AI Flashcards via POST /api/sync/save-study-material
  await test('POST /api/sync/save-study-material saves AI flashcard decks', async () => {
    const payload = {
      university: 'ISBAT University',
      type: 'flashcard_deck',
      deck: {
        id: 'deck-ai-hec1207',
        courseCode: 'HEC1207',
        title: 'HEC1207 AI Active Recall: Management Functions',
        cards: [
          {
            id: 'c-1',
            front: 'What are the 4 fundamental functions of management?',
            back: 'Planning, Organizing, Leading, Controlling.',
            mastered: true,
          },
          {
            id: 'c-2',
            front: 'What is Strategic Planning?',
            back: 'Long-term planning designed by top-tier executives.',
            mastered: false,
          },
        ],
      },
    };

    const res = await fetch(`${BASE_URL}/api/sync/save-study-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: MOCK_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'success');
  });

  // Test 4: Fetch full user cloud state with token
  await test('GET /api/sync/fetch-user-data returns populated cloud state for authenticated user', async () => {
    const res = await fetch(`${BASE_URL}/api/sync/fetch-user-data`, {
      headers: {
        Authorization: MOCK_TOKEN,
      },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'success');
    assert.ok(data.student);
    assert.strictEqual(data.student.name, 'BUSINGE SAMUEL');
    assert.strictEqual(data.student.regNumber, 'HECS26DA');
    assert.strictEqual(data.courses.length, 2);
    assert.strictEqual(data.courses[0].code, 'HEC1207');
    assert.strictEqual(data.events.length, 1);
    assert.strictEqual(data.flashcardDecks.length, 1);
    assert.strictEqual(data.flashcardDecks[0].courseCode, 'HEC1207');
    assert.strictEqual(data.feeSummary.balanceOutstanding, 400000);
  });

  console.log('\n========================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
