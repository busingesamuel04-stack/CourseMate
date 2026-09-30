const assert = require('assert');
const { chromium } = require('playwright');

async function testMultiUniversityAndTierLogin() {
  console.log('=== Test 3: Testing 2-Tier Login & Multi-University Scaling in Chromium ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('3A. React Application Loaded.');

    // Clear any previous student data but mark as onboarded to test in-app modal
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('coursemate_onboarded', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    console.log('3B. Reset to initial clean state with in-app access.');

    // 1. Open Source Connect Modal
    const portalSyncBtn = page.locator('button:has-text("Connect Portal")').first();
    await portalSyncBtn.waitFor({ state: 'visible', timeout: 5000 });
    await portalSyncBtn.click();

    // 2. Verify Tier 1: Profile Identity Indicator (Guest Mode)
    const guestStatus = await page.locator('text=Guest Mode').first().isVisible();
    console.log('3C. Tier 1 Identity Indicator shows Guest Mode:', guestStatus);
    assert.ok(guestStatus, 'Should show Guest Mode in identity indicator');

    // 3. Verify Tier 2: University Selector Dropdown
    const uniSelect = page.locator('select').first();
    await uniSelect.waitFor({ state: 'visible', timeout: 3000 });
    console.log('3D. Tier 2 University Selector is visible.');

    // 4. Select Makerere University
    console.log('3E. Selecting Makerere University...');
    await uniSelect.selectOption('Makerere University');
    await page.waitForTimeout(400);

    // Verify ACMIS Badge appears
    const acmisBadge = page.locator('text=Live ACMIS Portal Bridge');
    await acmisBadge.waitFor({ state: 'visible', timeout: 3000 });
    console.log('    ✓ ACMIS Adapter bridge badge visible for Makerere University!');

    // 5. Load Makerere University Verified Snapshot
    const loadMakBtn = page.locator('button:has-text("Load Makerere University Verified Snapshot")');
    await loadMakBtn.waitFor({ state: 'visible', timeout: 3000 });
    await loadMakBtn.click();

    // Wait for success confirmation
    const successBanner = page.locator('text=Source Verified & Successfully Synchronized!');
    await successBanner.waitFor({ state: 'visible', timeout: 8000 });
    console.log('    ✓ Makerere snapshot hydrated successfully!');

    // Verify snapshot details
    const studentInfo = await page.locator('text=/Kato Samuel/i').first().isVisible();
    console.log('    Student Kato Samuel in sync summary:', studentInfo);
    assert.ok(studentInfo, 'Sync summary should show Kato Samuel');

    // Close modal
    await page.locator('button:has-text("Done")').click();
    await page.waitForTimeout(500);

    // 6. Verify Home Screen Canopy reflects Makerere Student
    const welcomeHeader = await page.locator('h1').first().textContent();
    console.log('3F. Home Canopy Header:', welcomeHeader);
    assert.ok(welcomeHeader.toUpperCase().includes('KATO SAMUEL'), 'Welcome header should display Kato Samuel');

    // 7. Verify Courses Screen reflects Makerere Units (CSC2100)
    console.log('3G. Checking Courses tab for Makerere units (CSC2100)...');
    await page.locator('button:has-text("Courses")').first().click();
    await page.waitForTimeout(500);

    const cscCourse = await page.locator('text=CSC2100').first().isVisible();
    console.log('    Makerere course CSC2100 visible in Courses:', cscCourse);
    assert.ok(cscCourse, 'Courses tab should list CSC2100');

    // 8. Verify Add Task Modal has CSC2100
    console.log('3H. Checking Planner Add Task Modal dropdown...');
    await page.locator('button:has-text("Planner")').first().click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Add Task")').first().click();
    await page.waitForTimeout(300);

    const cscOptionCount = await page.locator('select option[value="CSC2100"]').count();
    console.log('    AddTaskModal has CSC2100 in dropdown:', cscOptionCount > 0);
    assert.ok(cscOptionCount > 0, 'AddTaskModal should have CSC2100 in dropdown');
    await page.locator('button[aria-label="Close modal"]').first().click();
    await page.waitForTimeout(300);

    // 9. Re-open Modal and verify Tier 1 is now "Signed In & Synced"
    console.log('3I. Re-opening Source Connect Modal to verify Tier 1 Signed In status...');
    await page.locator('button:has-text("Home")').first().click();
    await page.waitForTimeout(300);

    // Click quick action pill
    const portalSyncPill = page.locator('button:has-text("Portal Sync")').first();
    await portalSyncPill.click();
    await page.waitForTimeout(300);

    const signedInStatus = await page.locator('text=Signed In & Synced').first().isVisible();
    console.log('    Tier 1 Identity Indicator shows Signed In & Synced:', signedInStatus);
    assert.ok(signedInStatus, 'Should show Signed In & Synced in Tier 1 indicator');

    // 10. Switch to ISBAT and sync ISMIS Portal
    console.log('3J. Switching to ISBAT University and syncing ISMIS...');
    const uniSelect2 = page.locator('select').first();
    await uniSelect2.selectOption('ISBAT University');
    await page.waitForTimeout(300);

    const syncIsbatBtn = page.locator('button:has-text("Authenticate & Sync Registration")');
    await syncIsbatBtn.waitFor({ state: 'visible', timeout: 3000 });
    await syncIsbatBtn.click();

    await page.locator('text=Source Verified & Successfully Synchronized!').waitFor({ state: 'visible', timeout: 8000 });
    console.log('    ✓ ISBAT ISMIS portal synced successfully!');

    await page.locator('button:has-text("Done")').click();
    await page.waitForTimeout(500);

    // Verify Home canopy restored to ISBAT BUSINGE SAMUEL
    const isbatWelcome = await page.locator('h1').first().textContent();
    console.log('3K. Restored ISBAT Welcome Header:', isbatWelcome);
    assert.ok(isbatWelcome.includes('BUSINGE SAMUEL'), 'Welcome header should display BUSINGE SAMUEL');

    console.log('\n🎉 ALL MULTI-UNIVERSITY & 2-TIER LOGIN TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Multi-university test failure:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testMultiUniversityAndTierLogin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
