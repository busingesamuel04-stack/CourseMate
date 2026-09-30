require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { parsePortalHtml } = require('./parsers/portalParser');

// Target Endpoints
const PORTAL_URLS = {
  LOGIN: 'https://erp.isbatuniversity.ac.ug/frmStudentLogin.aspx',
  HOME: 'https://erp.isbatuniversity.ac.ug/STUDENT/frmStudentHome.aspx'
};

/**
 * Automates student login to ISBAT University ISMIS and extracts the dashboard data.
 *
 * @param {string} username - Student Username / Registration ID
 * @param {string} password - Student Password
 * @param {object} [options={}] - Custom configuration options
 * @returns {Promise<object>} Parsed student dashboard data or error object
 */
async function authenticateAndFetchHtml(username, password, options = {}) {
  // Support mock mode for offline testing with local portal.html
  if (options.mock) {
    console.log('[Mode: MOCK] Reading local portal.html fixture...');
    const localHtmlPath = path.join(process.cwd(), 'portal.html');
    const fallbackPath = path.join(process.cwd(), 'test', 'mock_dashboard.html');
    const targetPath = fs.existsSync(localHtmlPath) ? localHtmlPath : fallbackPath;
    const html = fs.readFileSync(targetPath, 'utf8');
    return parsePortalHtml(html);
  }

  // Validate input parameters
  if (!username || !password) {
    return {
      status: 'error',
      message: 'Invalid credentials: username and password are required.'
    };
  }

  const isHeadless = options.headless !== undefined ? options.headless : (process.env.HEADLESS !== 'false');
  const timeout = options.timeout || parseInt(process.env.SCRAPER_TIMEOUT || '20000', 10);
  const userAgent =
    options.userAgent ||
    process.env.USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  let browser = null;
  let context = null;

  try {
    // 1. Launch Chromium headless browser
    console.log(`[1/5] Launching Chromium browser (headless: ${isHeadless})...`);
    browser = await chromium.launch({
      headless: isHeadless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    context = await browser.newContext({
      userAgent,
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Capture browser alert dialogs (e.g. "Invalid Username or Password")
    let dialogMessage = null;
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.warn(`[Portal Alert Dialog] Message: "${dialogMessage}"`);
      await dialog.dismiss().catch(() => {});
    });

    // 2. Navigate to login page
    console.log(`[2/5] Navigating to: ${PORTAL_URLS.LOGIN}`);
    await page.goto(PORTAL_URLS.LOGIN, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // 3 & 4. Locate and fill Username and Password fields
    // Supports #txt_1 / #txt_2 as well as ASP.NET WebForms #Content_txtUsername / #Content_txtPassword
    console.log('[3/5] Locating and filling login input fields...');
    const userLocator = page.locator('#txt_1, #Content_txtUsername, input[name*="txtUsername"]').first();
    const passLocator = page.locator('#txt_2, #Content_txtPassword, input[name*="txtPassword"]').first();
    const btnLocator = page.locator('#btn_Login, #Content_btLogin, input[name*="btLogin"], input[type="submit"]').first();

    await userLocator.waitFor({ state: 'visible', timeout: 10000 });
    await passLocator.waitFor({ state: 'visible', timeout: 10000 });
    await btnLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Allow inline window.onload scripts (disableBackButton, UpdatePanels) to settle
    await page.waitForTimeout(500);

    // Fill credentials
    await userLocator.fill(username);
    await passLocator.fill(password);

    // 5. Click login and await navigation to student home
    console.log('[4/5] Clicking login button and awaiting navigation to student dashboard...');
    try {
      await Promise.all([
        page.waitForURL('**/STUDENT/frmStudentHome.aspx', {
          timeout: 15000,
          waitUntil: 'networkidle'
        }),
        btnLocator.click()
      ]);
    } catch (navErr) {
      // Navigation didn't reach student home within timeout; will be checked below
    }

    // Brief stabilization window to capture any dialog or DOM update
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log(`[Current URL]: ${currentUrl}`);

    // 6. Check for login failure (dialog triggered or still on login page)
    if (dialogMessage || currentUrl.toLowerCase().includes('frmstudentlogin.aspx') || !currentUrl.includes('/STUDENT/')) {
      const errorText = await page.evaluate(() => {
        const el = document.querySelector('#Content_valSummary, .val_message, .error, [id*="lblError"], [id*="lblMsg"]');
        return el ? el.innerText.trim() : null;
      }).catch(() => null);

      const failureMessage = dialogMessage || errorText || 'Invalid credentials';
      console.warn(`[Login Failed]: ${failureMessage}`);

      return {
        status: 'error',
        message: failureMessage
      };
    }

    // 7. Successful login: retrieve HTML and parse with parsePortalHtml()
    console.log('[5/5] Login successful! Extracting page content...');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Ensure primary dashboard elements are loaded
    await page.waitForSelector('table, #lblName, .user-info-panel, body', { timeout: 10000 }).catch(() => {});

    const pageHtml = await page.content();

    // Optionally save HTML dump for debugging
    if (options.saveHtml) {
      fs.writeFileSync(path.join(process.cwd(), 'portal_dump.html'), pageHtml, 'utf8');
      console.log('Saved live dashboard snapshot to portal_dump.html');
    }

    // Parse extracted HTML using Cheerio
    return parsePortalHtml(pageHtml);

  } catch (err) {
    console.error(`[Scraper Execution Error]: ${err.message}`);
    return {
      status: 'error',
      message: err.message
    };
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// ==========================================
// 8. CLI Test Runner
// ==========================================
if (require.main === module) {
  (async () => {
    const rawArgs = process.argv.slice(2);
    const isMock = rawArgs.includes('--mock') || process.env.USE_MOCK === 'true';
    const saveHtml = rawArgs.includes('--save-html');
    const filteredArgs = rawArgs.filter(a => !a.startsWith('--'));

    // Read credentials from CLI arguments, environment variables, or .env
    const username = filteredArgs[0] || process.env.STUDENT_USER;
    const password = filteredArgs[1] || process.env.STUDENT_PASS;

    console.log('====================================================');
    console.log(' CourseMate - ISBAT University ISMIS Live Scraper   ');
    console.log('====================================================');

    if (isMock) {
      console.log('Running in MOCK mode (--mock flag detected)...\n');
    } else if (!username || !password) {
      console.log('Usage:');
      console.log('  node src/scraper.js <username> <password>');
      console.log('  STUDENT_USER=IU/... STUDENT_PASS=... node src/scraper.js');
      console.log('  node src/scraper.js --mock\n');
      console.log('No credentials provided. Running mock extraction against portal.html...\n');
    } else {
      console.log(`Authenticating as: ${username}\n`);
    }

    const useMock = isMock || (!username && !password);

    const result = await authenticateAndFetchHtml(username, password, {
      mock: useMock,
      saveHtml
    });

    console.log('\n--- Extraction Result ---');
    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      fs.writeFileSync(path.join(process.cwd(), 'output.json'), JSON.stringify(result, null, 2), 'utf8');
      console.log('\n✓ Clean data saved to output.json');
    }
  })();
}

module.exports = {
  PORTAL_URLS,
  authenticateAndFetchHtml,
  parsePortalHtml
};
