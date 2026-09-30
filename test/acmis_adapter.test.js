const assert = require('assert');
const { chromium } = require('playwright');
const { authenticateAndFetchAcmis, getAcmisMockData, ACMIS_PORTALS } = require('../src/adapters/acmisAdapter.js');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testAcmisAdapterDirect() {
  console.log('=== 1. Testing ACMIS Scraping Adapter Directly (Unit & Mock Structure) ===');

  // Test 1A: Portals Config Registry
  console.log('1A. Verifying ACMIS portal configurations...');
  assert.ok(ACMIS_PORTALS['Makerere University'], 'Makerere University portal must be defined');
  assert.strictEqual(ACMIS_PORTALS['Makerere University'].baseUrl, 'https://myportal.mak.ac.ug');
  assert.strictEqual(ACMIS_PORTALS['Kyambogo University'].baseUrl, 'https://myportal.kyu.ac.ug');
  assert.strictEqual(ACMIS_PORTALS['MUBS'].baseUrl, 'https://myportal.mubs.ac.ug');
  console.log('    ✓ Portal configurations verified.');

  // Test 1B: Makerere University Mock Payload
  console.log('1B. Testing Makerere University snapshot structure...');
  const makResult = await authenticateAndFetchAcmis('22/U/1048', 'secretpassword', {
    university: 'Makerere University',
    mock: true
  });

  assert.strictEqual(makResult.status, 'success');
  assert.strictEqual(makResult.university, 'Makerere University');
  assert.strictEqual(makResult.student.name, 'KATO SAMUEL');
  assert.strictEqual(makResult.student.regNumber, '22/U/1048');
  assert.ok(makResult.courses.length >= 4, 'Makerere should have 4 semester courses');
  
  const csc2100 = makResult.courses.find(c => c.code === 'CSC2100');
  assert.ok(csc2100, 'Should include CSC2100 Data Structures');
  assert.strictEqual(csc2100.creditUnits, 4);
  assert.ok(csc2100.timetable.examDate, 'Should have exam date');
  assert.ok(makResult.feeSummary.prn, 'Fee statement must contain PRN');
  assert.strictEqual(makResult.feeSummary.clearanceStatus, 'Cleared');
  console.log('    ✓ Makerere snapshot valid (CSC2100, PRN:', makResult.feeSummary.prn, ')');

  // Test 1C: Kyambogo University Mock Payload
  console.log('1C. Testing Kyambogo University snapshot structure...');
  const kyuResult = await authenticateAndFetchAcmis('23/U/204', 'secretpassword', {
    university: 'Kyambogo University',
    mock: true
  });

  assert.strictEqual(kyuResult.status, 'success');
  assert.strictEqual(kyuResult.university, 'Kyambogo University');
  assert.strictEqual(kyuResult.student.name, 'OKELLO DAVID');
  assert.strictEqual(kyuResult.student.regNumber, '23/U/204');
  assert.ok(kyuResult.courses.some(c => c.code === 'CSC2100'), 'Should include CSC2100 Data Structures');
  assert.ok(kyuResult.courses.some(c => c.code === 'BIT2103'), 'Should include BIT2103 Database Systems');
  assert.ok(kyuResult.courses.some(c => c.code === 'MTH2101'), 'Should include MTH2101 Discrete Mathematics');
  assert.ok(kyuResult.feeSummary.prn, 'Should have PRN');
  assert.strictEqual(kyuResult.feeSummary.examClearance, true);
  assert.strictEqual(kyuResult.feeSummary.balance, 0);
  console.log('    ✓ Kyambogo snapshot valid (CSC2100, BIT2103, MTH2101, PRN:', kyuResult.feeSummary.prn, ')');

  // Test 1D: MUBS Mock Payload
  console.log('1D. Testing MUBS snapshot structure...');
  const mubsResult = await authenticateAndFetchAcmis('24/U/512', 'secretpassword', {
    university: 'MUBS',
    mock: true
  });

  assert.strictEqual(mubsResult.status, 'success');
  assert.strictEqual(mubsResult.university, 'MUBS');
  assert.strictEqual(mubsResult.student.name, 'KATO SAMUEL');
  assert.ok(mubsResult.courses.some(c => c.code === 'BBC1201'), 'Should include BBC1201');
  console.log('    ✓ MUBS snapshot valid (BBC1201, PRN:', mubsResult.feeSummary.prn, ')');

  // Test 1E: Missing Credentials Validation in Live Mode
  console.log('1E. Testing validation error when credentials missing...');
  const missingResult = await authenticateAndFetchAcmis('', '', {
    university: 'Makerere University',
    mock: false
  });
  assert.strictEqual(missingResult.status, 'error');
  assert.ok(missingResult.message.includes('required'), 'Should indicate credentials are required');
  console.log('    ✓ Missing credentials correctly rejected.');
  console.log('✓ Direct ACMIS Adapter unit checks passed!\n');
}

async function testAcmisApiRoutes() {
  console.log('=== 2. Testing Express /api/sync-portal Route with ACMIS Universities ===');

  // Test 2A: Makerere Sync via API with mock: true
  console.log('2A. Posting /api/sync-portal for Makerere University with mock: true...');
  const makRes = await fetch(`${BASE_URL}/api/sync-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      university: 'Makerere University',
      username: '22/U/1048',
      password: 'password123',
      mock: true
    })
  });
  assert.strictEqual(makRes.status, 200);
  const makData = await makRes.json();
  assert.strictEqual(makData.status, 'success');
  assert.strictEqual(makData.institution, 'Makerere University');
  assert.strictEqual(makData.university, 'Makerere University');
  assert.strictEqual(makData.student.name, 'KATO SAMUEL');
  assert.ok(makData.courses.length >= 4);
  assert.ok(makData.courses.some(c => c.code === 'CSC2100'));
  console.log('    ✓ Makerere API sync succeeded:', makData.student.name);

  // Test 2B: Kyambogo Sync via API with mock: true
  console.log('2B. Posting /api/sync-portal for Kyambogo University with mock: true...');
  const kyuRes = await fetch(`${BASE_URL}/api/sync-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      university: 'Kyambogo University',
      username: '23/U/204',
      password: 'password123',
      mock: true
    })
  });
  assert.strictEqual(kyuRes.status, 200);
  const kyuData = await kyuRes.json();
  assert.strictEqual(kyuData.status, 'success');
  assert.strictEqual(kyuData.student.name, 'OKELLO DAVID');
  console.log('    ✓ Kyambogo API sync succeeded:', kyuData.student.name);

  // Test 2C: MUBS Sync via API
  console.log('2C. Posting /api/sync-portal for MUBS...');
  const mubsRes = await fetch(`${BASE_URL}/api/sync-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      university: 'MUBS',
      username: '24/U/512',
      password: 'password123',
      mock: true
    })
  });
  assert.strictEqual(mubsRes.status, 200);
  const mubsData = await mubsRes.json();
  assert.strictEqual(mubsData.status, 'success');
  assert.strictEqual(mubsData.student.name, 'KATO SAMUEL');
  console.log('    ✓ MUBS API sync succeeded:', mubsData.student.name);
  console.log('    ✓ MUBS API sync succeeded:', mubsData.student.name);

  // Test 2D: Missing credentials check for ACMIS
  console.log('2D. Testing missing credentials for ACMIS rejection...');
  const badRes = await fetch(`${BASE_URL}/api/sync-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      university: 'Makerere University',
      username: '',
      password: '',
      useMock: false
    })
  });
  assert.strictEqual(badRes.status, 400);
  console.log('    ✓ Missing ACMIS credentials correctly returned 400 Bad Request.');
  console.log('✓ Express /api/sync-portal ACMIS endpoints verified!\n');
}

async function testAcmisFrontendUI() {
  console.log('=== 3. Testing ACMIS Ingestion & UI Hydration in Chromium ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Ensure onboarded state to test SourceConnectModal
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('coursemate_onboarded', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });

    // Open Source Connect Modal
    const portalSyncBtn = page.locator('button:has-text("Connect Portal")').first();
    await portalSyncBtn.waitFor({ state: 'visible', timeout: 5000 });
    await portalSyncBtn.click();

    // Select Makerere University
    const uniSelect = page.locator('select').first();
    await uniSelect.waitFor({ state: 'visible', timeout: 3000 });
    await uniSelect.selectOption('Makerere University');
    await page.waitForTimeout(400);

    // Verify ACMIS Portal form is active
    const syncBtn = page.locator('button:has-text("Authenticate & Sync")').first();
    await syncBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('3A. Makerere ACMIS Portal Bridge form is active.');

    // Authenticate and sync
    await page.locator('input[type="text"]').fill('22/U/1048');
    await page.locator('input[type="password"]').fill('secretpassword');
    await syncBtn.click();

    // Wait for success confirmation
    const successBanner = page.locator('text=Ledger Verified & Synchronized');
    await successBanner.waitFor({ state: 'visible', timeout: 8000 });
    console.log('3B. ✓ Makerere ACMIS portal data synced via UI!');

    // Close modal
    await page.locator('button:has-text("Done")').click();
    await page.waitForTimeout(500);

    // Verify Home canopy displays Kato Samuel
    const welcomeHeader = await page.locator('h1').first().textContent();
    console.log('3C. Home Screen Header:', welcomeHeader);
    assert.ok(welcomeHeader.toUpperCase().includes('KATO SAMUEL'), 'Welcome header must display Kato Samuel');

    // Verify Courses tab lists CSC2100
    await page.locator('button:has-text("Courses")').first().click();
    await page.waitForTimeout(400);
    const hasCsc2100 = await page.locator('text=CSC2100').first().isVisible();
    console.log('3D. Courses Tab lists CSC2100 Data Structures:', hasCsc2100);
    assert.ok(hasCsc2100, 'Courses screen must display CSC2100');

    // Verify Profile tab displays Makerere Fee statement & PRN
    await page.locator('button:has-text("Profile")').first().click();
    await page.waitForTimeout(400);
    const hasPrn = await page.locator('text=/PRN24901827491|PRN/').first().isVisible();
    console.log('3E. Profile Tab displays ACMIS PRN Fee Statement:', hasPrn);
    assert.ok(hasPrn, 'Profile must display PRN statement');

    console.log('\n🎉 ALL ACMIS SCRAPING & INTEGRATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('ACMIS Frontend UI Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function runAllAcmisTests() {
  await testAcmisAdapterDirect();
  await testAcmisApiRoutes();
  await testAcmisFrontendUI();
}

runAllAcmisTests().catch(err => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
