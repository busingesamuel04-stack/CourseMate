/**
 * test/watcher_endpoint.test.js
 * ────────────────────────────────────────────────────────────
 * Verification suite for Portal Watcher Cron & Lifecycle.
 */

import {
  registerPortalWatcherCredential,
  getConnectedAccounts,
  runWatcherCycleForAccount,
  getPastChangeEvents,
  markChangeEventsRead,
} from '../src/jobs/portalCron.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function run() {
  console.log('=== Testing Portal Watcher Job & LifeCycle ===\n');

  // Mock dependencies
  const dispatchedPushes = [];
  const mockDeps = {
    supabaseAdmin: null,
    getSubscriptionsForUser: async (uid) => [{ endpoint: 'https://push.example.com/' + uid }],
    sendPushNotification: async (sub, payload) => {
      dispatchedPushes.push({ sub, payload });
      return true;
    },
    authenticateAndFetchHtml: async () => ({ status: 'success', courses: [] }),
    authenticateAndFetchAcmis: async () => ({ status: 'success', courses: [] }),
  };

  // Test registration
  registerPortalWatcherCredential({
    profileId: 'test-user-123',
    university: 'Makerere University',
    username: '2100701234',
    password: 'samplePassword',
    useMock: true,
  });

  const accounts = getConnectedAccounts();
  assert(accounts.some((a) => a.profileId === 'test-user-123'), 'Registered account found in watcher registry');

  // Test running watcher cycle with forceDiff: true
  const runResult = await runWatcherCycleForAccount(
    accounts.find((a) => a.profileId === 'test-user-123'),
    mockDeps,
    { forceDiff: true, applyJitter: false }
  );

  assert(runResult.status === 'success', 'Watcher cycle completed with status: success');
  assert(runResult.changesDetected >= 3, `Expected >= 3 detected changes, got ${runResult.changesDetected}`);
  assert(runResult.alertsDispatched >= 3, `Expected >= 3 alerts dispatched, got ${runResult.alertsDispatched}`);
  assert(dispatchedPushes.length >= 3, `Push notifications dispatched: ${dispatchedPushes.length}`);

  // Test fetching past change events
  const pastEvents = await getPastChangeEvents('test-user-123', null);
  assert(pastEvents.length >= 3, `Past change events saved in memory: ${pastEvents.length}`);
  assert(pastEvents.some((e) => e.type === 'EXAM'), 'EXAM event recorded');
  assert(pastEvents.some((e) => e.type === 'FINANCE'), 'FINANCE event recorded');
  assert(pastEvents.some((e) => e.type === 'GRADE'), 'GRADE event recorded');

  // Test mark read
  await markChangeEventsRead('test-user-123', undefined, true, null);
  const updatedEvents = await getPastChangeEvents('test-user-123', null);
  assert(updatedEvents.every((e) => e.is_read === true), 'All events marked as read');

  console.log('\n✅ Portal Watcher Job & LifeCycle Verification Passed 100%!');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
