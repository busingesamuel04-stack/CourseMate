const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { parsePortalHtml } = require('../src/parsers/portalParser');

function runTest() {
  console.log('--- Running Parser Unit Tests ---');
  const mockHtmlPath = path.join(__dirname, 'mock_dashboard.html');
  const mockHtml = fs.readFileSync(mockHtmlPath, 'utf8');

  const result = parsePortalHtml(mockHtml);
  console.log('Parsed Output:\n', JSON.stringify(result, null, 2));

  // Verify status
  assert.strictEqual(result.status, 'success', 'Status should be success');

  // Verify student profile
  assert.strictEqual(result.student.name, 'Alex Tumusiime', 'Student name mismatch');
  assert.strictEqual(result.student.regNumber, 'IU/2023/BCS/1042', 'Reg number mismatch');
  assert.strictEqual(result.student.program, 'Bachelor of Science in Computer Science (BCS)', 'Program mismatch');

  // Verify fee summary
  assert.ok(result.feeSummary.totalBilled.includes('4,200,000'), 'Total billed mismatch');
  assert.ok(result.feeSummary.totalPaid.includes('3,500,000'), 'Total paid mismatch');
  assert.ok(result.feeSummary.outstandingBalance.includes('700,000'), 'Outstanding balance mismatch');

  // Verify courses
  assert.strictEqual(result.courses.length, 5, 'Should have parsed 5 courses');
  assert.strictEqual(result.courses[0].code, 'BCS2101');
  assert.strictEqual(result.courses[0].title, 'Data Structures and Algorithms');
  assert.strictEqual(result.courses[0].creditUnits, 4.0);
  assert.strictEqual(result.courses[0].grade, 'A');

  // Verify ISO timestamp
  assert.ok(!Number.isNaN(Date.parse(result.scrapedAt)), 'scrapedAt must be valid ISO timestamp');

  console.log('✓ All Parser Unit Tests Passed Successfully!');
}

runTest();
