const assert = require('assert');
const { chromium } = require('playwright');

async function testSyncBridgeAPI() {
  console.log('=== Test 1: Testing Backend POST /api/sync-portal Directly ===');

  // Test 1A: Missing credentials validation
  console.log('1A. Testing missing credentials validation (expecting 400)...');
  const resBad = await fetch('http://localhost:3000/api/sync-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '', password: '', useMock: false })
  });
  const dataBad = await resBad.json();
  console.log('    Status:', resBad.status, 'Message:', dataBad.message);
  assert.strictEqual(resBad.status, 400, 'Should return 400 for missing credentials');
  assert.strictEqual(dataBad.status, 'error');

  // Test 1B: Successful sync using verified snapshot
  console.log('1B. Testing verified snapshot sync (expecting 200)...');
  const resOk = await fetch('http://localhost:3000/api/sync-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'HECS26DA', password: 'secretpassword', useMock: true })
  });
  const dataOk = await resOk.json();
  console.log('    Status:', resOk.status, 'Student:', dataOk.student ? dataOk.student.name : null);
  assert.strictEqual(resOk.status, 200, 'Should return 200 for valid sync');
  assert.strictEqual(dataOk.status, 'success');
  assert.strictEqual(dataOk.student.name, 'BUSINGE SAMUEL');
  assert.strictEqual(dataOk.student.regNumber, 'HECS26DA');
  assert.ok(dataOk.courses.length >= 6, 'Should extract at least 6 course units');

  console.log('✓ Backend API /api/sync-portal verified successfully!\n');
}

async function testFrontendSyncIntegration() {
  console.log('=== Test 2: Testing React 19 Frontend Sync Integration in Chromium ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('coursemate_onboarded', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    console.log('2A. React Application Loaded.');

    // 2B. Locate and click "Portal Sync" quick action pill
    console.log('2B. Clicking "Portal Sync" quick action pill...');
    const portalSyncPill = page.locator('button:has-text("Portal Sync")').first();
    await portalSyncPill.waitFor({ state: 'visible', timeout: 5000 });
    await portalSyncPill.click();

    // Verify modal is displayed
    const modalHeading = page.locator('text=Keep CourseMate Automatically Updated');
    await modalHeading.waitFor({ state: 'visible', timeout: 3000 });
    console.log('    Source Connect Modal opened successfully.');

    // 2C. Submit portal sync
    console.log('2C. Authenticating & Syncing ISMIS Portal...');
    const syncBtn = page.locator('button:has-text("Authenticate & Sync Registration")');
    await syncBtn.waitFor({ state: 'visible', timeout: 3000 });
    await syncBtn.click();

    // Wait for success banner
    const successBanner = page.locator('text=Source Verified & Successfully Synchronized!');
    await successBanner.waitFor({ state: 'visible', timeout: 10000 });
    console.log('    ✓ Success banner visible!');

    // Close modal
    const doneBtn = page.locator('button:has-text("Done")');
    await doneBtn.click();
    await page.waitForTimeout(500);

    // 2D. Verify student name updated on Home canopy
    const welcomeHeader = await page.locator('h1').first().textContent();
    console.log('    Welcome Header on Home:', welcomeHeader);
    assert.ok(welcomeHeader.includes('BUSINGE SAMUEL'), 'Welcome header should display BUSINGE SAMUEL');

    // 2E. Verify Profile Screen Fee Ledger
    console.log('2E. Navigating to Profile & Sync tab...');
    const profileTabBtn = page.locator('button:has-text("Profile")').first();
    await profileTabBtn.click();
    await page.waitForTimeout(500);

    const feeLedgerTitle = page.locator('text=Official University Fee Ledger');
    await feeLedgerTitle.waitFor({ state: 'visible', timeout: 3000 });

    const totalBilled = await page.locator('text=NCHE (2 terms), GUILD (2 terms)').first().isVisible();
    console.log('    Fee Ledger NCHE & GUILD statement visible:', totalBilled);
    assert.ok(totalBilled, 'Fee statement should display NCHE & GUILD terms');

    // 2F. Verify Courses Tab lists HEC1207
    console.log('2F. Navigating to Courses tab...');
    const coursesTabBtn = page.locator('button:has-text("Courses")').first();
    await coursesTabBtn.click();
    await page.waitForTimeout(500);

    const hecCourse = await page.locator('text=HEC1207').first().isVisible();
    console.log('    Enrolled course unit HEC1207 visible:', hecCourse);
    assert.ok(hecCourse, 'Courses tab should list HEC1207');

    // 2G. Verify Home Screen has NO hardcoded demo strings (CS301 & CS304)
    console.log('2G. Navigating back to Home tab & verifying dynamic deadlines...');
    const homeTabBtn = page.locator('button:has-text("Home")').first();
    await homeTabBtn.click();
    await page.waitForTimeout(500);

    const homeContent = await page.content();
    assert.ok(!homeContent.includes('(CS301 & CS304)'), 'Home screen should NOT have hardcoded (CS301 & CS304)');
    const hasDynamicDueText = homeContent.includes('HEC1207') || homeContent.includes('HEC1208');
    console.log('    Dynamic course unit present in Home deadlines:', hasDynamicDueText);
    assert.ok(hasDynamicDueText, 'Home deadlines should reference synced HEC courses');

    // 2H. Verify Add Task Modal lists synced courses
    console.log('2H. Navigating to Planner tab & testing Add Task modal...');
    const plannerTabBtn = page.locator('button:has-text("Planner")').first();
    await plannerTabBtn.click();
    await page.waitForTimeout(500);

    const addTaskBtn = page.locator('button:has-text("Add Task")').first();
    await addTaskBtn.click();
    await page.waitForTimeout(300);

    const courseOptionCount = await page.locator('select option[value="HEC1207"]').count();
    console.log('    AddTaskModal has HEC1207 in dropdown:', courseOptionCount > 0);
    assert.ok(courseOptionCount > 0, 'AddTaskModal should have HEC1207 in course dropdown');

    const closeTaskModalBtn = page.locator('button[aria-label="Close modal"]').first();
    await closeTaskModalBtn.click();
    await page.waitForTimeout(300);

    // 2I. Verify Study Tab has synced flashcard deck & quiz
    console.log('2I. Navigating to Study & Retention tab...');
    const studyTabBtn = page.locator('button:has-text("Study")').first();
    await studyTabBtn.click();
    await page.waitForTimeout(500);

    const studyContent = await page.content();
    const hasStudyDeck = studyContent.includes('HEC1207') || studyContent.includes('HEC1208');
    console.log('    Study screen has synced HEC courses:', hasStudyDeck);
    assert.ok(hasStudyDeck, 'Study tab should reference synced courses');

    console.log('\n✓ Full End-to-End React 19 Frontend Sync Verified Successfully!');
  } catch (err) {
    console.error('Integration test failure:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function runAll() {
  await testSyncBridgeAPI();
  await testFrontendSyncIntegration();
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runAll().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
