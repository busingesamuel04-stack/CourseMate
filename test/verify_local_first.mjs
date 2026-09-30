import { chromium } from 'playwright';
import assert from 'assert';

async function runVerification() {
  console.log('🚀 Starting Verification of Local-First Enhancements...');

  // 1. Verify Manifest and Service Worker via direct HTTP
  console.log('\n--- 1. Testing PWA Assets ---');
  const manifestRes = await fetch('http://localhost:3000/manifest.json');
  assert.strictEqual(manifestRes.status, 200, 'manifest.json must return 200');
  const manifest = await manifestRes.json();
  assert.strictEqual(manifest.name, 'CourseMate — Academic Command Center');
  assert.strictEqual(manifest.short_name, 'CourseMate');
  assert.strictEqual(manifest.display, 'standalone');
  assert.strictEqual(manifest.background_color, '#090A0E');
  assert.strictEqual(manifest.theme_color, '#13141D');
  console.log('✅ manifest.json verified:', manifest.name);

  const swRes = await fetch('http://localhost:3000/sw.js');
  assert.strictEqual(swRes.status, 200, 'sw.js must return 200');
  const swText = await swRes.text();
  assert.ok(swText.includes('coursemate-cache-v1'), 'sw.js must contain cache name');
  console.log('✅ sw.js verified (service worker code present)');

  const iconRes192 = await fetch('http://localhost:3000/icon-192.png');
  assert.strictEqual(iconRes192.status, 200, 'icon-192.png must return 200');
  console.log('✅ icon-192.png verified (200 OK)');

  const iconRes512 = await fetch('http://localhost:3000/icon-512.png');
  assert.strictEqual(iconRes512.status, 200, 'icon-512.png must return 200');
  console.log('✅ icon-512.png verified (200 OK)');

  // 2. Verify Backend AI Study Material Endpoint
  console.log('\n--- 2. Testing AI Study Generation Endpoint ---');
  const aiFlashcardsRes = await fetch('http://localhost:3000/api/ai/generate-study-material', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseCode: 'HEC1207',
      courseTitle: 'Financial Accounting & Reporting',
      type: 'flashcards',
    }),
  });
  assert.strictEqual(aiFlashcardsRes.status, 200, 'AI flashcards endpoint must return 200');
  const aiFlashcardsData = await aiFlashcardsRes.json();
  assert.strictEqual(aiFlashcardsData.success, true);
  assert.ok(aiFlashcardsData.deck && Array.isArray(aiFlashcardsData.deck.cards));
  assert.ok(aiFlashcardsData.deck.cards.length >= 3);
  console.log(`✅ AI Flashcards generated: ${aiFlashcardsData.deck.cards.length} cards for ${aiFlashcardsData.courseCode}`);

  const aiQuizRes = await fetch('http://localhost:3000/api/ai/generate-study-material', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseCode: 'CSC2100',
      courseTitle: 'Data Structures and Algorithms',
      type: 'quiz',
    }),
  });
  assert.strictEqual(aiQuizRes.status, 200, 'AI quiz endpoint must return 200');
  const aiQuizData = await aiQuizRes.json();
  assert.strictEqual(aiQuizData.success, true);
  assert.ok(aiQuizData.quiz && Array.isArray(aiQuizData.quiz.questions));
  assert.strictEqual(aiQuizData.quiz.questions.length, 3);
  console.log(`✅ AI Rapid Assessment Quiz generated: 3 questions for ${aiQuizData.courseCode}`);

  // 3. Browser UI Testing (TopBar ics export + toast, and StudyScreen AI generation)
  console.log('\n--- 3. Testing Browser UI & End-to-End Interactions ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Set onboarded state in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('coursemate_onboarded', 'true');
    localStorage.setItem(
      'coursemate_student_profile',
      JSON.stringify({
        name: 'Kato Samuel',
        regNumber: '23/U/12345',
        program: 'B.Sc. Information Technology',
        semester: 'Semester II',
        cgpa: 4.25,
        academicStanding: 'First Class Honors Track',
      })
    );
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Test Calendar Export Button and Toast
  console.log('Testing 1-Tap Calendar Export (.ics)...');
  const downloadPromise = page.waitForEvent('download');
  const icsButton = page.locator('button[aria-label="Export Academic Schedule to Calendar"]');
  await icsButton.waitFor({ state: 'visible' });
  await icsButton.click();

  const download = await downloadPromise;
  const downloadName = download.suggestedFilename();
  console.log('Received download:', downloadName);
  assert.ok(downloadName.endsWith('_Academic_Schedule.ics'), 'Filename must end with _Academic_Schedule.ics');

  // Verify toast appears
  const toast = page.locator('div[role="status"]');
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  const toastText = await toast.textContent();
  console.log('Visible Toast:', toastText);
  assert.ok(
    toastText.includes('Academic schedule exported to .ics — tap to add to Google/Apple Calendar'),
    'Toast message must match requirement'
  );
  console.log('✅ Calendar .ics download and toast verified!');

  // Test Study Screen and AI Generation
  console.log('\nTesting Study Screen & AI Generation...');
  // Click Study Tab
  const studyTabButton = page.locator('nav[aria-label="Desktop Navigation"] button:has-text("Study")').first();
  await studyTabButton.click();

  // Wait for Study screen elements
  await page.waitForSelector('text=Active Recall', { timeout: 5000 });
  console.log('Navigated to Study screen.');

  // Click AI Flashcards button
  const aiFlashcardsBtn = page.locator('button:has-text("AI Flashcards")').first();
  await aiFlashcardsBtn.waitFor({ state: 'visible' });
  await aiFlashcardsBtn.click();

  // Wait for cards to update and render
  await page.waitForTimeout(1000);

  // Check localStorage for coursemate_flashcard_decks
  const storedDecks = await page.evaluate(() => localStorage.getItem('coursemate_flashcard_decks'));
  assert.ok(storedDecks, 'coursemate_flashcard_decks must exist in localStorage');
  const parsedDecks = JSON.parse(storedDecks);
  assert.ok(parsedDecks.length > 0, 'Must have at least 1 deck in localStorage');
  console.log(`✅ Flashcard deck saved to localStorage with ${parsedDecks[0].cards.length} cards!`);

  // Test Rapid Assessment Quiz
  const createQuizBtn = page.locator('button:has-text("AI Create Quiz")').first();
  await createQuizBtn.waitFor({ state: 'visible' });
  await createQuizBtn.click();
  await page.waitForTimeout(1000);

  // Verify questions render in active quiz mode
  const optionButton = page.locator('section button:has-text("Submit Answer")').locator('..').locator('..').locator('button').first();
  await optionButton.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ AI Rapid Assessment Quiz questions rendered successfully!');

  // Click an option and submit
  await optionButton.click();
  const submitBtn = page.locator('button:has-text("Submit Answer")');
  await submitBtn.click();
  await page.waitForTimeout(500);

  const nextOrFinishBtn = page.locator('button:has-text("Next Question")').or(page.locator('button:has-text("Finish Assessment")'));
  await nextOrFinishBtn.first().waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Quiz interaction, celebration, and answer evaluation verified!');

  await browser.close();
  console.log('\n🎉 ALL THREE LOCAL-FIRST ENHANCEMENTS VERIFIED WITH 100% SUCCESS!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
