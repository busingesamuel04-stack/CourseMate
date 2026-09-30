// Test script for Web Push and Portal Change Detection endpoints
async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing CourseMate Push Notification & Portal Change APIs...\n');

  // 1. GET /api/notifications/vapid-key
  try {
    const res = await fetch(`${baseUrl}/api/notifications/vapid-key`);
    const data = await res.json();
    console.log('1. GET /api/notifications/vapid-key:');
    console.log('   Status:', res.status);
    console.log('   PublicKey:', data.publicKey ? `${data.publicKey.slice(0, 30)}...` : 'NONE');
    if (!data.publicKey) throw new Error('Missing VAPID key');
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
  }

  // 2. POST /api/notifications/subscribe
  const mockSub = {
    endpoint: `https://fcm.googleapis.com/fcm/send/mock-device-${Date.now()}`,
    expirationTime: null,
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DKM',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  };

  try {
    const res = await fetch(`${baseUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-mock-test-123',
      },
      body: JSON.stringify({ subscription: mockSub }),
    });
    const data = await res.json();
    console.log('\n2. POST /api/notifications/subscribe:');
    console.log('   Status:', res.status, data.status);
    console.log('   Message:', data.message);
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
  }

  // 3. POST /api/notifications/test
  try {
    const res = await fetch(`${baseUrl}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-mock-test-123',
      },
    });
    const data = await res.json();
    console.log('\n3. POST /api/notifications/test:');
    console.log('   Status:', res.status, data.status);
    console.log('   Sent count:', data.sent);
    console.log('   Message:', data.message);
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
  }

  // 4. POST /api/sync/check-updates (Simulate portal change detection)
  const freshSnapshot = {
    courses: [
      {
        code: 'HEC1207',
        title: 'Front Office Operations',
        examDate: '2024-11-28', // Rescheduled!
        examVenue: 'Auditorium 1 (Main Campus)',
        attendancePercent: 68, // Dropped below 75%!
        courseworkMark: 38,
        courseworkTotal: 40,
      },
    ],
    feeLedger: {
      totalOwed: 2500000,
      totalPaid: 2500000,
      balance: 0,
      isCleared: true, // Clearance granted!
    },
    snapshotAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${baseUrl}/api/sync/check-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-mock-test-123',
      },
      body: JSON.stringify({
        snapshot: freshSnapshot,
      }),
    });
    const data = await res.json();
    console.log('\n4. POST /api/sync/check-updates (Portal diff detection):');
    console.log('   Status:', res.status, data.status);
    console.log('   Changes detected:', data.changesDetected);
    console.log('   Alerts dispatched:', data.alertsDispatched);
    console.log('   Detected diffs:', data.diffs);
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
  }

  // 5. GET /api/notifications/alerts
  try {
    const res = await fetch(`${baseUrl}/api/notifications/alerts`, {
      headers: {
        Authorization: 'Bearer user-mock-test-123',
      },
    });
    const data = await res.json();
    console.log('\n5. GET /api/notifications/alerts:');
    console.log('   Status:', res.status, data.status);
    console.log('   Alerts count:', data.alerts?.length);
    if (data.alerts?.length > 0) {
      console.log('   Sample alert:', data.alerts[0].title);
    }
  } catch (err) {
    console.error('   ❌ Failed:', err.message);
  }

  console.log('\n✅ All Push & Portal Change Detection API tests finished!');
}

runTests();
