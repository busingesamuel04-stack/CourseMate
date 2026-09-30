/**
 * notifications.ts
 * ────────────────────────────────────────────────────────────
 * Frontend Web Push subscription manager for CourseMate.
 *
 * Responsibilities:
 *  1. Register service worker.
 *  2. Request notification permission from user.
 *  3. Subscribe to push via VAPID public key from backend.
 *  4. POST subscription to /api/notifications/subscribe.
 *  5. Expose helpers for test notification, unsubscribe, and status.
 */

export interface PushSubscriptionStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  subscription: PushSubscription | null;
}

// ── Internal: fetch VAPID public key from backend ───────────────────────────
async function fetchVapidPublicKey(): Promise<string> {
  const resp = await fetch('/api/notifications/vapid-key');
  if (!resp.ok) throw new Error(`Failed to fetch VAPID key: ${resp.status}`);
  const { publicKey } = await resp.json();
  if (!publicKey) throw new Error('No VAPID public key returned from server');
  return publicKey;
}

// ── Internal: url-safe base64 → Uint8Array (VAPID key conversion) ───────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    outputArray[i] = raw.charCodeAt(i);
  }
  return outputArray;
}

// ── Service Worker Registration ─────────────────────────────────────────────
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Notifications] Service worker registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[Notifications] Service worker registration failed:', err);
    return null;
  }
}

// ── Status Check ────────────────────────────────────────────────────────────
export async function getPushStatus(): Promise<PushSubscriptionStatus> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { supported: false, permission: 'unsupported', subscribed: false, subscription: null };
  }

  const permission = Notification.permission;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    return {
      supported: true,
      permission,
      subscribed: Boolean(subscription),
      subscription,
    };
  } catch {
    return { supported: true, permission, subscribed: false, subscription: null };
  }
}

// ── Subscribe to Push ───────────────────────────────────────────────────────
export async function subscribeToPush(authToken?: string): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { success: false, error: 'Push notifications not supported on this device.' };
  }

  // 1. Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return { success: false, error: 'Notification permission was denied.' };
  }

  try {
    // 2. Ensure SW is registered and ready
    const reg = await navigator.serviceWorker.ready;

    // 3. Check for existing subscription
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      console.log('[Notifications] Already subscribed — refreshing server record.');
      await persistSubscription(existing, authToken);
      return { success: true, subscription: existing };
    }

    // 4. Fetch VAPID public key
    const vapidPublicKey = await fetchVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 5. Create new push subscription
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });

    // 6. Persist to backend
    await persistSubscription(subscription, authToken);
    console.log('[Notifications] ✅ Push subscription created and persisted.');
    return { success: true, subscription };
  } catch (err: any) {
    console.error('[Notifications] Subscribe error:', err);
    return { success: false, error: err.message || 'Failed to subscribe to push notifications.' };
  }
}

// ── Persist subscription to backend ────────────────────────────────────────
async function persistSubscription(subscription: PushSubscription, authToken?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const resp = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Server rejected subscription: ${resp.status}`);
  }
  return resp.json();
}

// ── Unsubscribe ─────────────────────────────────────────────────────────────
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Notifications] Unsubscribed from push.');
    }
    return true;
  } catch (err) {
    console.error('[Notifications] Unsubscribe error:', err);
    return false;
  }
}

// ── Send a test notification (via backend) ──────────────────────────────────
export async function sendTestNotification(authToken?: string): Promise<{ success: boolean; message: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const resp = await fetch('/api/notifications/test', { method: 'POST', headers });
  const data = await resp.json();
  return {
    success: resp.ok && data.status === 'success',
    message: data.message || data.error || 'Unknown response',
  };
}
