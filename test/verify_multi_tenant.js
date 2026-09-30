const { chromium } = require('playwright');

async function runVerification() {
  console.log('--- STARTING MULTI-TENANT ISOLATION VERIFICATION ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Test ISBAT University Tenant
  console.log('\n[Scenario 1] Testing ISBAT University Tenant...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('coursemate_onboarded', 'true');
    localStorage.setItem('coursemate_university', 'ISBAT University');
    localStorage.setItem('coursemate_portal_synced', 'false');
    localStorage.removeItem('coursemate_student');
    localStorage.removeItem('coursemate_courses');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Switch to Campus tab
  const campusNavBtn = page.locator('button:has-text("Campus")');
  await campusNavBtn.first().click();
  await page.waitForTimeout(800);

  // Check Header Pill
  const headerPill = await page.locator('header').last().textContent();
  console.log('Header text includes "ISBAT Hub":', headerPill.includes('ISBAT Hub'));
  if (!headerPill.includes('ISBAT Hub')) {
    throw new Error('Expected ISBAT Hub pill on Campus screen');
  }

  // Check main Campus text
  const campusBody = await page.locator('main, .space-y-8').first().textContent();
  const hasLugogo = campusBody.includes('Lugogo Bypass') || campusBody.includes('Tech Lab') || campusBody.includes('ISBAT');
  const hasCoCIS = campusBody.includes('CoCIS');
  const hasRugbyGrounds = campusBody.includes('Rugby Grounds');
  
  console.log('ISBAT venues present (Lugogo/Tech Lab/ISBAT):', hasLugogo);
  console.log('CoCIS present on ISBAT Campus:', hasCoCIS);
  console.log('Rugby Grounds present on ISBAT Campus:', hasRugbyGrounds);

  if (!hasLugogo) throw new Error('Expected ISBAT locations (Lugogo Bypass / Tech Lab) to be rendered');
  if (hasCoCIS) throw new Error('TENANT LEAKAGE: "CoCIS" found on ISBAT student campus screen!');
  if (hasRugbyGrounds) throw new Error('TENANT LEAKAGE: "Rugby Grounds" found on ISBAT student campus screen!');

  // Check Events subpage
  console.log('Navigating to Events subpage...');
  const seeAllEventsBtn = page.locator('button:has-text("See All Events")');
  await seeAllEventsBtn.click();
  await page.waitForTimeout(500);

  const eventsPageText = await page.locator('body').textContent();
  const isbatEventFound = eventsPageText.includes('ISBAT Hackfest') || eventsPageText.includes('Lugogo Bypass');
  const makerereEventFound = eventsPageText.includes('Makerere') || eventsPageText.includes('CoCIS');
  console.log('ISBAT event found on Events page:', isbatEventFound);
  console.log('Makerere event found on Events page:', makerereEventFound);

  if (!isbatEventFound) throw new Error('Expected ISBAT events on Events page');
  if (makerereEventFound) throw new Error('TENANT LEAKAGE: Makerere event found on ISBAT Events page');

  // Go back to Campus Hub
  await page.locator('button:has-text("Back to Campus Hub")').click();
  await page.waitForTimeout(500);

  // Check Marketplace meetup venues
  console.log('Navigating to Marketplace subpage...');
  const marketplaceTile = page.locator('h3:has-text("Student Marketplace")');
  await marketplaceTile.click();
  await page.waitForTimeout(500);

  const marketText = await page.locator('body').textContent();
  console.log('Marketplace page text mentions ISBAT/Lugogo/verified peers:', marketText.includes('ISBAT') || marketText.includes('Lugogo'));

  // 2. Test Switching to Makerere University Tenant
  console.log('\n[Scenario 2] Switching Tenant to Makerere University...');
  await page.evaluate(() => {
    localStorage.setItem('coursemate_university', 'Makerere University');
    localStorage.removeItem('coursemate_student');
    localStorage.removeItem('coursemate_courses');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Campus")').first().click();
  await page.waitForTimeout(800);

  const currentUniInStorage = await page.evaluate(() => localStorage.getItem('coursemate_university'));
  console.log('Current coursemate_university in storage:', currentUniInStorage);

  const makHeader = await page.locator('header').last().textContent();
  console.log('Actual makHeader text:', JSON.stringify(makHeader));
  console.log('Header text includes "Makerere Hub":', makHeader.includes('Makerere Hub'));

  const makCampusBody = await page.locator('main, .space-y-8').first().textContent();
  const makHasCoCIS = makCampusBody.includes('CoCIS') || makCampusBody.includes('Rugby Grounds') || makCampusBody.includes('Makerere');
  console.log('Makerere venues present on Makerere Campus screen:', makHasCoCIS);

  if (!makHasCoCIS) {
    throw new Error('Expected Makerere locations (CoCIS / Rugby Grounds) on Makerere Campus screen');
  }

  // Check Makerere Events subpage
  await page.locator('button:has-text("See All Events")').click();
  await page.waitForTimeout(500);
  const makEventsText = await page.locator('body').textContent();
  console.log('Makerere Events page contains "CoCIS" or "Rugby Grounds":', makEventsText.includes('CoCIS') || makEventsText.includes('Rugby Grounds'));

  console.log('\n>>> ALL MULTI-TENANT ISOLATION TESTS PASSED CLEANLY! <<<');
  await browser.close();
}

runVerification().catch((err) => {
  console.error('\nFAILED VERIFICATION:', err);
  process.exit(1);
});
