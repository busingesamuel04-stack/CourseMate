const assert = require('assert');
const { chromium } = require('playwright');

async function testRetentionFeatures() {
  console.log('=== Testing CourseMate Problem-Solving Retention Features ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('1. Page loaded.');

    // Dismiss onboarding if shown
    const isOnboarding = await page.isVisible('#onboardingOverlay:not(.hidden)');
    if (isOnboarding) {
      await page.click('#onboardingActionBtn');
      await page.waitForTimeout(300);
      await page.click('#onboardingActionBtn');
      await page.waitForTimeout(300);
    }

    // ----------------------------------------------------
    // Test 1: 1-Tap Calendar Sync (.ics Export)
    // ----------------------------------------------------
    console.log('\n2. Testing 1-Tap Calendar Sync (.ics Export)...');
    const isCalendarBannerVisible = await page.isVisible('.calendar-sync-banner');
    assert.ok(isCalendarBannerVisible, 'Calendar sync banner should be visible on Schedule tab');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCalendarBtn');
    const download = await downloadPromise;
    const downloadFilename = download.suggestedFilename();
    console.log('   Downloaded calendar file:', downloadFilename);
    assert.strictEqual(downloadFilename, 'CourseMate-ISBAT-Schedule.ics', 'Filename should be CourseMate-ISBAT-Schedule.ics');

    // Read download stream content
    const stream = await download.createReadStream();
    let icsContent = '';
    for await (const chunk of stream) {
      icsContent += chunk.toString();
    }
    assert.ok(icsContent.includes('BEGIN:VCALENDAR'), '.ics must contain BEGIN:VCALENDAR');
    assert.ok(icsContent.includes('HEC1207'), '.ics must contain HEC1207 lecture and exam');
    assert.ok(icsContent.includes('END:VCALENDAR'), '.ics must contain END:VCALENDAR');
    console.log('   ✓ Calendar .ics export generated and validated successfully!');

    // ----------------------------------------------------
    // Test 2: Attendance Safety Radar & Predictive Calculator (Modules Tab)
    // ----------------------------------------------------
    console.log('\n3. Testing Attendance Safety Radar (Modules Tab)...');
    await page.click('button[data-tab="modules"]');
    await page.waitForTimeout(300);

    const isRadarBannerVisible = await page.isVisible('.attendance-radar-banner');
    assert.ok(isRadarBannerVisible, 'Attendance safety radar banner should be visible');

    const safeCount = await page.textContent('.radar-stat-num.safe');
    const atRiskCount = await page.textContent('.radar-stat-num.at-risk');
    const criticalCount = await page.textContent('.radar-stat-num.critical');
    console.log(`   Radar Stats: Safe: ${safeCount}, At Risk: ${atRiskCount}, Critical: ${criticalCount}`);
    assert.ok(parseInt(safeCount) >= 1, 'Should have at least 1 safe module');
    assert.ok(parseInt(atRiskCount) >= 1, 'Should have at least 1 at-risk module');
    assert.ok(parseInt(criticalCount) >= 1, 'Should have at least 1 critical module');

    // Check safety pills on module cards
    const safetyPills = await page.$$eval('.safety-status-pill', pills => pills.map(p => p.textContent.trim()));
    console.log('   Module Safety Pills:', safetyPills);
    assert.ok(safetyPills.some(p => p.includes('Safe')), 'Should display Safe status pill');
    assert.ok(safetyPills.some(p => p.includes('At Risk')), 'Should display At Risk status pill');
    assert.ok(safetyPills.some(p => p.includes('Critical')), 'Should display Critical status pill');

    // Check threshold marker line
    const thresholdLineCount = await page.$$eval('.attendance-threshold-line', lines => lines.length);
    assert.strictEqual(thresholdLineCount, 6, 'All 6 modules should render 75% threshold line');

    // Test What-if Simulator (+1 Attend)
    console.log('   Testing What-If Simulator (+1 Attend on HEC1208)...');
    const firstWhatIfBtn = await page.$('.whatif-btn');
    assert.ok(firstWhatIfBtn, 'What-if attend button should exist');
    await firstWhatIfBtn.click();
    await page.waitForTimeout(200);
    const hasResetBtn = await page.isVisible('button:has-text("Reset")');
    assert.ok(hasResetBtn, 'Reset button should appear after simulating attendance');
    console.log('   ✓ Attendance Safety Radar & Predictive Calculator verified!');

    // ----------------------------------------------------
    // Test 3: GPA & Target Grade Simulator
    // ----------------------------------------------------
    console.log('\n4. Testing GPA / Target Grade Simulator...');
    await page.click('#openGpaSimulatorBtn');
    await page.waitForTimeout(300);

    const isGpaModalOpen = await page.evaluate(() => document.getElementById('gpaModalSheet').classList.contains('open'));
    assert.ok(isGpaModalOpen, 'GPA simulator modal should be open');

    // Test First Class Preset (All A's)
    await page.click('button:has-text("First Class (A)")');
    await page.waitForTimeout(200);
    let gpaVal = await page.textContent('#projectedGpaValue');
    let honoursBadge = await page.textContent('#gpaHonoursBadge');
    console.log(`   First Class Preset: GPA = ${gpaVal}, Classification = ${honoursBadge}`);
    assert.strictEqual(gpaVal, '5.00', 'All A grades should yield 5.00 GPA');
    assert.ok(honoursBadge.includes('First Class Honours'), 'Should display First Class Honours badge');

    // Test Pass Preset
    await page.click('button:has-text("Pass (B/C)")');
    await page.waitForTimeout(200);
    gpaVal = await page.textContent('#projectedGpaValue');
    honoursBadge = await page.textContent('#gpaHonoursBadge');
    console.log(`   Pass Preset: GPA = ${gpaVal}, Classification = ${honoursBadge}`);
    assert.ok(parseFloat(gpaVal) < 4.0, 'Pass preset should yield lower GPA');

    // Save target grades
    await page.click('#saveGpaTargetsBtn');
    await page.waitForTimeout(300);
    const isGpaModalClosed = await page.evaluate(() => !document.getElementById('gpaModalSheet').classList.contains('open'));
    assert.ok(isGpaModalClosed, 'GPA modal should close after saving targets');
    console.log('   ✓ GPA & Target Grade Simulator verified successfully!');

    // ----------------------------------------------------
    // Test 4: Offline-First Caching & Connectivity Indicator
    // ----------------------------------------------------
    console.log('\n5. Testing Offline-First Caching & Connectivity Indicator...');
    const islandTextBefore = await page.textContent('#islandStatusText');
    console.log('   Online state:', islandTextBefore);
    assert.strictEqual(islandTextBefore, 'ISMIS Live', 'Should indicate ISMIS Live when online');

    // Simulate going offline
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(200);

    const islandTextOffline = await page.textContent('#islandStatusText');
    const isIslandOfflineClass = await page.evaluate(() => document.getElementById('dynamicIsland').classList.contains('offline'));
    console.log('   Offline state:', islandTextOffline, 'Class .offline:', isIslandOfflineClass);
    assert.strictEqual(islandTextOffline, 'Offline (Cached)', 'Should display Offline (Cached)');
    assert.ok(isIslandOfflineClass, 'Dynamic island should have .offline class');

    // Simulate going back online
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(200);
    const islandTextOnline = await page.textContent('#islandStatusText');
    assert.strictEqual(islandTextOnline, 'ISMIS Live', 'Should return to ISMIS Live');
    console.log('   ✓ Offline-First connectivity states verified!');

    // ----------------------------------------------------
    // Test 5: Interactive Campus Feed & Deadlines Tasks
    // ----------------------------------------------------
    console.log('\n6. Testing Interactive Campus Feed & Actionable Tasks...');
    await page.click('button[data-tab="feed"]');
    await page.waitForTimeout(300);

    // Filter by Deadlines
    const deadlineFilterBtn = await page.$('.feed-filter-pill:has-text("Deadlines")');
    assert.ok(deadlineFilterBtn, 'Deadlines filter pill should exist');
    await deadlineFilterBtn.click();
    await page.waitForTimeout(200);

    const visibleFeedCards = await page.$$eval('.feed-card', cards => cards.map(c => c.textContent));
    console.log(`   Deadlines Filter: Displaying ${visibleFeedCards.length} notices`);
    assert.ok(visibleFeedCards.length >= 2, 'Should display at least 2 deadline notices');

    // Add first deadline to tasks
    const addToTasksBtn = await page.$('.feed-action-btn:has-text("+ Add to Tasks")');
    if (addToTasksBtn) {
      await addToTasksBtn.click();
      await page.waitForTimeout(200);
    }

    const taskItems = await page.$$eval('.task-item-row', rows => rows.map(r => r.textContent.trim()));
    console.log(`   Tasks Checklist has ${taskItems.length} items`);
    assert.ok(taskItems.length >= 1, 'Should have tasks rendered in checklist');

    // Toggle Task completion
    const firstCheckbox = await page.$('.task-checkbox');
    assert.ok(firstCheckbox, 'Task checkbox should exist');
    await firstCheckbox.click();
    await page.waitForTimeout(200);
    const isTaskCompleted = await page.evaluate(() => document.querySelector('.task-item-row').classList.contains('completed'));
    assert.ok(isTaskCompleted, 'Toggled task should have .completed class');

    // Dismiss a notice card
    const initialCardCount = await page.$$eval('.feed-card', cards => cards.length);
    const dismissBtn = await page.$('.feed-action-btn:has-text("Dismiss")');
    assert.ok(dismissBtn, 'Dismiss button should exist');
    await dismissBtn.click();
    await page.waitForTimeout(400);
    const afterDismissCount = await page.$$eval('.feed-card:not(.dismissed)', cards => cards.length);
    console.log(`   Notice dismissed: ${initialCardCount} -> ${afterDismissCount}`);
    assert.strictEqual(afterDismissCount, initialCardCount - 1, 'Dismissed card should be removed from view');

    console.log('   ✓ Interactive Campus Feed & Tasks verified successfully!');

    console.log('\n=============================================================');
    console.log('🎉 ALL 5 PROBLEM-SOLVING RETENTION FEATURES VERIFIED 100%!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRetentionFeatures();
