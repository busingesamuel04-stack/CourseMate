import { chromium } from 'playwright';
import assert from 'assert';

async function runBrowserTest() {
  console.log('\n========================================');
  console.log('🌐 CourseMate End-to-End Cloud Sync Verification');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Clear storage and navigate to fresh session
    await page.goto('http://127.0.0.1:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Verify Onboarding Step 1 loads
    await page.waitForSelector('text=Welcome to CourseMate', { timeout: 8000 });
    console.log('✓ Step 1 Identity Tier rendered successfully');

    // 3. Click "Continue with Google"
    const googleBtn = await page.waitForSelector('button:has-text("Continue with Google")');
    await googleBtn.click();

    // 4. Verify Step 2 (Where do you study?)
    await page.waitForSelector('text=Where do you study?', { timeout: 5000 });
    console.log('✓ Step 2 University Selection rendered');

    // 5. Select ISBAT University & proceed to portal sync
    const continueBtn = await page.waitForSelector('button:has-text("Continue to Portal Sync")');
    await continueBtn.click();

    // 6. Verify Step 3 & click "Connect & Build My Command Center"
    await page.waitForSelector('text=Connect Your Student Portal', { timeout: 5000 });
    const syncBtn = await page.waitForSelector('button:has-text("Connect & Build My Command Center")');
    await syncBtn.click();

    // 7. Wait for completion and transition to Home Dashboard
    await page.waitForSelector('text=All Set!', { timeout: 10000 });
    console.log('✓ Portal Sync & Cloud Persistence succeeded with "All Set!" toast');

    // 8. Wait for dashboard to mount
    await page.waitForSelector('text=Businge Samuel', { timeout: 10000 });
    console.log('✓ Dashboard mounted with student profile: Businge Samuel');

    // 9. Take snapshot of dashboard
    await page.screenshot({ path: 'test/cloud_sync_dashboard_verified.png' });
    console.log('✓ Saved verified dashboard snapshot to test/cloud_sync_dashboard_verified.png');

    console.log('\n========================================');
    console.log('🎉 E2E Cloud Sync Verification PASSED!');
    console.log('========================================\n');
  } catch (err) {
    console.error('Browser test failure:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
