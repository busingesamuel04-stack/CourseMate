const { chromium } = require('playwright');
const assert = require('assert');

async function testOnboardingFlow() {
  console.log('=== Test 4: Testing Dedicated 3-Step Onboarding Flow in Chromium ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Initial fresh load without coursemate_onboarded
    console.log('4A. Loading initial fresh session (expecting OnboardingFlow full-screen)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    // Verify Onboarding Step 1 is rendered
    const welcomeTitle = await page.locator('text=Welcome to CourseMate').first().isVisible();
    console.log('    Welcome to CourseMate title visible:', welcomeTitle);
    assert.ok(welcomeTitle, 'Step 1: Welcome title should be visible');

    const subhead = await page.locator('text=Your Personal Academic Operating System').first().isVisible();
    console.log('    Subhead visible:', subhead);
    assert.ok(subhead, 'Step 1: Subhead should be visible');

    const googleBtn = await page.locator('button:has-text("Continue with Google")').first().isVisible();
    console.log('    Continue with Google button visible:', googleBtn);
    assert.ok(googleBtn, 'Step 1: Google Sign-in button should be visible');

    // 2. Click "Continue with Google" -> advances to Step 2
    console.log('4B. Clicking Continue with Google...');
    await page.locator('button:has-text("Continue with Google")').first().click();
    await page.waitForTimeout(400);

    // Verify Step 2 is rendered
    const step2Title = await page.locator('text=Where do you study?').first().isVisible();
    console.log('    Step 2 Title "Where do you study?" visible:', step2Title);
    assert.ok(step2Title, 'Step 2: Where do you study? should be visible');

    const isbatCard = await page.locator('text=ISBAT University').first().isVisible();
    const makerereCard = await page.locator('text=Makerere University').first().isVisible();
    console.log('    University cards visible:', { isbat: isbatCard, makerere: makerereCard });
    assert.ok(isbatCard && makerereCard, 'Step 2: Institutional cards should be visible');

    const liveBadge = await page.locator('text=Live ISMIS Portal Bridge').first().isVisible();
    console.log('    Live ISMIS Portal Bridge badge visible:', liveBadge);
    assert.ok(liveBadge, 'Step 2: ISBAT badge should show Live ISMIS Portal Bridge');

    // 3. Click "Continue to Portal Sync →" -> advances to Step 3
    console.log('4C. Clicking Continue to Portal Sync...');
    await page.locator('button:has-text("Continue to Portal Sync")').first().click();
    await page.waitForTimeout(400);

    // Verify Step 3 is rendered
    const step3Title = await page.locator('text=Connect Your Student Portal').first().isVisible();
    console.log('    Step 3 Title "Connect Your Student Portal" visible:', step3Title);
    assert.ok(step3Title, 'Step 3: Connect Your Student Portal should be visible');

    const connectBtn = page.locator('button:has-text("Connect & Build My Command Center")');
    await connectBtn.waitFor({ state: 'visible', timeout: 3000 });
    console.log('    Connect & Build My Command Center button ready.');

    // 4. Submit ISBAT sync with demo snapshot
    console.log('4D. Submitting portal sync...');
    await connectBtn.click();

    // Verify completion overlay appears
    const allSetOverlay = page.locator('text=All Set!');
    await allSetOverlay.waitFor({ state: 'visible', timeout: 5000 });
    console.log('    ✓ Final Handshake overlay "All Set!" visible!');

    // Wait for transition to HomeScreen
    await page.waitForTimeout(1500);

    // Verify HomeScreen welcome canopy displays student
    const homeCanopy = await page.locator('h1').first().textContent();
    console.log('4E. Home Canopy Header after onboarding:', homeCanopy);
    assert.ok(homeCanopy.includes('BUSINGE SAMUEL'), 'Home canopy should display BUSINGE SAMUEL');

    // Verify localStorage has coursemate_onboarded = 'true'
    const onboardedFlag = await page.evaluate(() => localStorage.getItem('coursemate_onboarded'));
    console.log('    localStorage.coursemate_onboarded:', onboardedFlag);
    assert.strictEqual(onboardedFlag, 'true', 'coursemate_onboarded must be stored as "true"');

    // 5. Test "Re-run Onboarding" from Profile Screen
    console.log('4F. Testing "Re-run Onboarding" from Profile Screen...');
    await page.locator('button:has-text("Profile")').first().click();
    await page.waitForTimeout(500);

    const rerunBtn = page.locator('button:has-text("Re-run Onboarding")').first();
    await rerunBtn.waitFor({ state: 'visible', timeout: 3000 });
    console.log('    Re-run Onboarding button visible in Profile.');
    await rerunBtn.click();
    await page.waitForTimeout(400);

    // Verify OnboardingFlow intercept triggered again
    const restartedWelcome = await page.locator('text=Welcome to CourseMate').first().isVisible();
    console.log('    OnboardingFlow re-opened full-screen:', restartedWelcome);
    assert.ok(restartedWelcome, 'OnboardingFlow should re-render full-screen after reset');

    // 6. Test Guest Escape Hatch + Makerere Snapshot
    console.log('4G. Testing Guest Escape Hatch and Makerere ACMIS snapshot...');
    await page.locator('button:has-text("Explore as Guest")').first().click();
    await page.waitForTimeout(400);

    // Select Makerere University
    await page.locator('text=Makerere University').first().click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Continue to Portal Sync")').first().click();
    await page.waitForTimeout(400);

    const makerereSnapshotBtn = page.locator('button:has-text("Load Makerere University Verified Snapshot")');
    await makerereSnapshotBtn.waitFor({ state: 'visible', timeout: 3000 });
    await makerereSnapshotBtn.click();

    // Verify completion overlay appears
    await page.locator('text=All Set!').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1500);

    // Verify HomeScreen welcome canopy displays Makerere student
    const makerereHomeHeader = await page.locator('h1').first().textContent();
    console.log('4H. Home Canopy Header with Makerere snapshot:', makerereHomeHeader);
    assert.ok(makerereHomeHeader.toUpperCase().includes('KATO SAMUEL'), 'Home header should show Kato Samuel');

    console.log('\n🎉 ALL ONBOARDING FLOW TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Onboarding flow test failure:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testOnboardingFlow().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
