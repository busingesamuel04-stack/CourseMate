/**
 * ISBAT University ISMIS Adapter
 * Proxies to core scraping engine in src/scraper.js
 */
const {
  authenticateAndFetchHtml,
  parseDashboardHtml,
  scrapeIsbatPortal,
  ISBAT_FIXTURES
} = require('../scraper.js');

module.exports = {
  authenticateAndFetchHtml,
  parseDashboardHtml,
  scrapeIsbatPortal,
  ISBAT_FIXTURES
};
