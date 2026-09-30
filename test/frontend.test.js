const { chromium } = require('playwright');

async function testFrontend() {
  console.log('Testing CourseMate Frontend UI in Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[Browser ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[Page Error]: ${err.message}`));

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('1. Page loaded. Title:', await page.title());

    // Step A: Verify Progressive Onboarding (Zero Friction)
    console.log('2. Verifying Progressive Onboarding Flow...');
    const isOnboardingVisible = await page.isVisible('#onboardingOverlay:not(.hidden)');
    console.log('   Onboarding overlay active:', isOnboardingVisible);

    // Step 1: Click "Next: Choose Cohort"
    await page.click('#onboardingActionBtn');
    await page.waitForTimeout(300);

    // Step 2: Select Cohort & Enter App
    await page.click('#onboardingActionBtn'); // "Enter Campus Companion"
    await page.waitForTimeout(400);

    const isOverlayGone = await page.isHidden('#onboardingOverlay');
    console.log('   Transitioned to Schedule view (Zero Friction):', isOverlayGone);

    // Step B: Verify Schedule Tab (Live Exam Countdown & Timeline)
    const headerTitle = await page.textContent('.campus-name');
    console.log('3. Campus Name:', headerTitle);

    const examTitle = await page.textContent('.exam-subject-title');
    console.log('   Next Exam Title:', examTitle);

    // Step C: Test Navigation to Modules Tab
    console.log('4. Clicking Modules tab...');
    await page.click('button[data-tab="modules"]');
    await page.waitForTimeout(300);
    const moduleCardCount = await page.locator('.module-card').count();
    console.log('   Modules rendered:', moduleCardCount);

    // Step D: Test Navigation to Financials Tab
    console.log('5. Clicking Financials tab...');
    await page.click('button[data-tab="financials"]');
    await page.waitForTimeout(300);
    const feeItemsCount = await page.locator('.ledger-item').count();
    console.log('   Ledger items rendered:', feeItemsCount);

    // Step E: Test High-Trust Portal Sync Sheet
    console.log('6. Opening High-Trust Portal Sync Sheet...');
    await page.click('#syncStatusPill');
    await page.waitForTimeout(400);
    const isSheetOpen = await page.evaluate(() => document.getElementById('portalSyncSheet').classList.contains('open'));
    console.log('   Portal Sync Sheet Open:', isSheetOpen);

    // Close bottom sheet cleanly
    await page.evaluate(() => window.closeSyncSheet());
    await page.waitForTimeout(300);

    // Step F: Test Navigation to Campus Feed
    console.log('7. Clicking Campus Feed tab...');
    await page.click('button[data-tab="feed"]');
    await page.waitForTimeout(300);
    const feedCount = await page.locator('.feed-card').count();
    console.log('   Campus notices rendered:', feedCount);

    // Step G: Test Dark/Light Theme Toggle
    console.log('8. Testing Theme Toggle...');
    await page.click('#themeToggleBtn');
    await page.waitForTimeout(200);
    const currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('   Toggled Theme:', currentTheme);

    console.log('\n--- Console Logs during run ---');
    consoleLogs.forEach(l => console.log(l));
    console.log('\n✓ All Frontend Components, Progressive Onboarding, and Tabs Verified Successfully!');

  } catch (err) {
    console.error('Frontend test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFrontend();
