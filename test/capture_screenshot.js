const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
  await page.locator('button:has-text("Campus")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test/campus_isbat_verified.png' });
  console.log('Successfully captured screenshot to test/campus_isbat_verified.png');
  await browser.close();
})();
