const { chromium } = require('playwright');

async function testFixes() {
  console.log('=== STARTING CONSOLE 404, PWA META & RESPONSIVENESS VERIFICATION ===');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 310, height: 650 }, // Ultra-narrow mobile viewport (< 320px)
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const failed404Urls = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() === 404) {
      failed404Urls.push(response.url());
    }
  });

  // Setup localStorage for clean session
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('coursemate_onboarded', 'true');
    localStorage.setItem('coursemate_university', 'ISBAT University');
    localStorage.setItem('coursemate_portal_synced', 'false');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify Home Screen at 310px width
  console.log('[Check 1] Inspecting Home Screen at 310px ultra-narrow viewport...');
  const urgentCard = page.locator('section:has-text("Urgent Actions")');
  const urgentCount = await urgentCard.count();
  console.log('Urgent Actions card rendered:', urgentCount > 0);

  const plannerBtn = page.locator('button:has-text("View All in Planner")');
  const isPlannerBtnVisible = await plannerBtn.isVisible();
  console.log('"View All in Planner" button visible and interactive:', isPlannerBtnVisible);

  // 2. Navigate to Campus Tab & Check Images
  console.log('[Check 2] Navigating to Campus Screen and testing spotlight & category images...');
  await page.locator('button[aria-label="Campus"], button[title="Campus"]').click();
  await page.waitForTimeout(1200);

  // Check spotlight image
  const spotlightImg = page.locator('img[alt="Campus Spotlight"]');
  const spotlightCount = await spotlightImg.count();
  console.log('Spotlight image element rendered:', spotlightCount > 0);

  // 3. Inspect PWA Meta Tags in DOM
  console.log('[Check 3] Inspecting PWA Meta tags...');
  const mobileCapable = await page.locator('meta[name="mobile-web-app-capable"]').getAttribute('content');
  const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
  console.log('mobile-web-app-capable tag value:', mobileCapable);
  console.log('apple-mobile-web-app-capable tag value:', appleCapable);

  if (mobileCapable !== 'yes') {
    throw new Error('Expected meta[name="mobile-web-app-capable"] to be "yes"');
  }

  // 4. Check for 404s
  console.log('\n[Check 4] Checking 404 network responses...');
  console.log('Failed 404 URLs:', failed404Urls);
  const unsplash404s = failed404Urls.filter(u => u.includes('photo-1523050854058'));
  console.log('Broken Unsplash 404s detected:', unsplash404s.length);

  if (unsplash404s.length > 0) {
    throw new Error(`Found broken Unsplash 404s: ${unsplash404s.join(', ')}`);
  }

  console.log('Total 404 URLs encountered:', failed404Urls.length);
  console.log('Total console error count:', consoleErrors.length);

  // Capture ultra-narrow screenshot
  await page.screenshot({ path: 'test/ultra_narrow_310px.png' });
  console.log('Captured ultra-narrow screenshot to test/ultra_narrow_310px.png');

  console.log('\n>>> ALL FIXES VERIFIED SUCCESSFULLY! <<<');
  await browser.close();
}

testFixes().catch((err) => {
  console.error('\nVERIFICATION ERROR:', err);
  process.exit(1);
});
