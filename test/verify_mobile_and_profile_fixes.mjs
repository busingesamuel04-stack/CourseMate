import { chromium } from 'playwright';
import assert from 'assert';

async function testMobileAndProfile() {
  console.log('🧪 Starting Mobile Layout & Profile Sync Verification...');

  const browser = await chromium.launch({ headless: true });
  
  // Test 1: Mobile Phone Screen (375px width, standard mobile)
  console.log('\n--- 1. Testing Mobile TopBar & Academic Command Fit ---');
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE / standard mobile
  });
  const page = await context.newPage();

  // Set onboarded state for Businge Samuel at ISBAT University
  await page.addInitScript(() => {
    localStorage.setItem('coursemate_onboarded', 'true');
    localStorage.setItem('coursemate_university', 'ISBAT University');
    localStorage.removeItem('coursemate_connections'); // Clear any legacy cached bug
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Verify Download HTML icon button is removed
  const downloadBtnCount = await page.locator('header button[title*="Standalone HTML"], header button:has-text("HTML")').count();
  assert.strictEqual(downloadBtnCount, 0, 'Download HTML button must be removed from header');
  console.log('✅ Confirmed Download HTML icon button removed from header navigation');

  // Verify header elements fit within viewport without horizontal page overflow
  const isOverflowing = await page.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.scrollWidth > window.innerWidth : false;
  });
  assert.strictEqual(isOverflowing, false, 'Header must not overflow mobile window width');
  console.log('✅ TopBar fits horizontally within mobile 375px width with zero overflow');

  // Verify wordmark elements are visible
  const brandTitle = page.locator('header span:has-text("CourseMate")').first();
  const subTitle = page.locator('header span:has-text("Academic Command")').first();
  await brandTitle.waitFor({ state: 'visible' });
  await subTitle.waitFor({ state: 'visible' });
  console.log('✅ "CourseMate Academic Command" branding visible and properly arranged');

  // Verify all essential mobile action buttons fit and are visible
  const aiTutorBtn = page.locator('header button[aria-label="Open AI Tutor"]').first();
  const addBtn = page.locator('header button[aria-label="Add Task or Event"]').first();
  const icsBtn = page.locator('header button[aria-label="Export Academic Schedule to Calendar"]').first();
  const notifBtn = page.locator('header button[aria-label="View notifications"]').first();
  const profileBtn = page.locator('header button[aria-label="View Student Profile"]').first();

  await aiTutorBtn.waitFor({ state: 'visible' });
  await addBtn.waitFor({ state: 'visible' });
  await icsBtn.waitFor({ state: 'visible' });
  await notifBtn.waitFor({ state: 'visible' });
  await profileBtn.waitFor({ state: 'visible' });
  console.log('✅ All 5 header actions (AI Tutor, Add, .ics, Notifications, Profile) fit cleanly');

  // Test 2: Profile Screen and School Portal of Businge Samuel
  console.log('\n--- 2. Testing Profile & Portal Connection Verification ---');
  await profileBtn.click();
  await page.waitForTimeout(600);

  // Verify student profile shows Businge Samuel & ISBAT University
  const profileName = page.locator('h1:has-text("BUSINGE SAMUEL"), h1:has-text("Businge Samuel")');
  await profileName.first().waitFor({ state: 'visible', timeout: 5000 });
  const profileText = await profileName.first().textContent();
  console.log('Student Name in Profile:', profileText);
  assert.ok(profileText?.toUpperCase().includes('BUSINGE SAMUEL'));

  const uniName = page.locator('span:has-text("ISBAT University")').first();
  await uniName.waitFor({ state: 'visible' });
  console.log('✅ Student university confirmed as ISBAT University');

  // Verify Academic Connections
  const isbatPortalConn = page.locator('h3:has-text("ISBAT University ISMIS Student Portal")');
  await isbatPortalConn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Connection confirmed: "ISBAT University ISMIS Student Portal"');

  // Verify Makerere ISMIS is NOT present
  const makerereConnCount = await page.locator('h3:has-text("Makerere ISMIS")').count();
  assert.strictEqual(makerereConnCount, 0, 'Must NOT mention Makerere ISMIS for Businge Samuel');
  console.log('✅ Verified zero trace of incorrect "Makerere ISMIS"');

  // Verify Fee Ledger states ISBAT ISMIS
  const feeLedgerText = page.locator('text=Real-time tuition, guild, and statutory NCHE payment balances from ISBAT ISMIS');
  await feeLedgerText.waitFor({ state: 'visible' });
  console.log('✅ Fee ledger verified: Real-time balances from ISBAT ISMIS');

  await browser.close();
  console.log('\n🎉 ALL MOBILE LAYOUT & ISBAT PORTAL FIXES VERIFIED SUCCESSFULLY!');
}

testMobileAndProfile().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
