/**
 * portalCron.ts
 * ────────────────────────────────────────────────────────────
 * CourseMate Background Portal Watcher Cron & Change Engine.
 *
 * Automatically polls university portals (ISBAT ERP / ACMIS) on a schedule,
 * applies rate-limiting with jitter, detects academic & financial diffs,
 * persists records to `portal_change_events`, and dispatches native Web Push.
 */

import cron from 'node-cron';
import {
  detectPortalChanges,
  formatPushPayload,
  PortalChangeEvent,
  PortalSnapshot,
} from '../services/portalWatcher.js';

export interface ConnectedPortalAccount {
  profileId: string;
  university: string;
  username: string;
  password?: string;
  useMock?: boolean;
  lastCheckedAt?: string;
  lastSnapshot?: PortalSnapshot;
}

export interface WatcherCycleResult {
  status: 'success' | 'no_credentials' | 'error';
  profileId: string;
  university: string;
  changesDetected: number;
  events: PortalChangeEvent[];
  alertsDispatched: number;
  message?: string;
}

export interface PortalCronDeps {
  supabaseAdmin: any;
  getSubscriptionsForUser: (userId: string) => Promise<any[]>;
  sendPushNotification: (sub: any, payload: any) => Promise<boolean>;
  authenticateAndFetchHtml?: any;
  authenticateAndFetchAcmis?: any;
}

// ── In-Memory Account Registry & Event Store ────────────────────────────────

const connectedAccounts = new Map<string, ConnectedPortalAccount>();
const memoryChangeEvents = new Map<string, PortalChangeEvent[]>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Register or update active portal credentials for background watching.
 */
export function registerPortalWatcherCredential(account: ConnectedPortalAccount): void {
  connectedAccounts.set(account.profileId, {
    ...connectedAccounts.get(account.profileId),
    ...account,
  });
  console.log(
    `[PortalWatcher] Registered credentials for profile ${account.profileId} (${account.university}, ${account.username})`
  );
}

/**
 * Get all currently registered connected accounts.
 */
export function getConnectedAccounts(): ConnectedPortalAccount[] {
  return Array.from(connectedAccounts.values());
}

/**
 * Record a detected change event in memory and Supabase.
 */
export async function recordChangeEvent(
  profileId: string,
  event: PortalChangeEvent,
  supabaseAdmin?: any
): Promise<void> {
  // 1. In-memory cache for instant retrieval
  const existing = memoryChangeEvents.get(profileId) || [];
  memoryChangeEvents.set(profileId, [event, ...existing].slice(0, 50));

  // 2. Persist to Supabase portal_change_events and portal_alerts
  if (supabaseAdmin) {
    try {
      const row = {
        profile_id: profileId,
        type: event.type,
        category: event.category,
        severity: event.severity,
        title: event.title,
        message: event.message,
        deep_link: event.deepLink,
        course_code: event.courseCode || null,
        meta: event.meta ? event.meta : null,
        is_read: false,
        detected_at: event.detectedAt,
      };

      const { error: eventErr } = await supabaseAdmin
        .from('portal_change_events')
        .insert(row);

      if (eventErr) {
        console.warn('[PortalWatcher] Could not insert to portal_change_events:', eventErr.message);
      }

      // Also persist to portal_alerts for backward compatibility
      await supabaseAdmin.from('portal_alerts').insert({
        profile_id: profileId,
        category: event.category,
        severity: event.severity === 'urgent' ? 'critical' : event.severity,
        title: event.title,
        body: event.message,
        course_code: event.courseCode || null,
        route_hint: event.routeHint,
        meta: event.meta ? JSON.stringify(event.meta) : null,
        is_read: false,
        created_at: event.detectedAt,
      }).then(() => {}).catch(() => {});
    } catch (err: any) {
      console.warn('[PortalWatcher] DB persist warning:', err.message);
    }
  }
}

/**
 * Fetch past change events for a user (from Supabase or memory fallback).
 */
export async function getPastChangeEvents(
  profileId: string,
  supabaseAdmin?: any
): Promise<PortalChangeEvent[]> {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('portal_change_events')
        .select('*')
        .eq('profile_id', profileId)
        .order('detected_at', { ascending: false })
        .limit(40);

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          type: r.type,
          category: r.category,
          severity: r.severity,
          title: r.title,
          message: r.message,
          body: r.message,
          deepLink: r.deep_link,
          routeHint: r.deep_link?.replace('/', '') || 'courses',
          courseCode: r.course_code,
          meta: r.meta,
          is_read: r.is_read,
          detectedAt: r.detected_at,
        }));
      }
    } catch {
      // fallback to memory
    }
  }

  // Fallback to in-memory store
  return memoryChangeEvents.get(profileId) || [];
}

/**
 * Mark change events as read.
 */
export async function markChangeEventsRead(
  profileId: string,
  eventId?: string,
  all?: boolean,
  supabaseAdmin?: any
): Promise<void> {
  const events = memoryChangeEvents.get(profileId) || [];
  if (all) {
    events.forEach((e: any) => (e.is_read = true));
  } else if (eventId) {
    events.forEach((e: any) => {
      if (e.id === eventId) e.is_read = true;
    });
  }

  if (supabaseAdmin) {
    try {
      if (all) {
        await supabaseAdmin
          .from('portal_change_events')
          .update({ is_read: true })
          .eq('profile_id', profileId);
        await supabaseAdmin
          .from('portal_alerts')
          .update({ is_read: true })
          .eq('profile_id', profileId);
      } else if (eventId) {
        await supabaseAdmin
          .from('portal_change_events')
          .update({ is_read: true })
          .eq('id', eventId)
          .eq('profile_id', profileId);
        await supabaseAdmin
          .from('portal_alerts')
          .update({ is_read: true })
          .eq('id', eventId)
          .eq('profile_id', profileId);
      }
    } catch (err: any) {
      console.warn('[PortalWatcher] Error marking events read in DB:', err.message);
    }
  }
}

/**
 * Convert scraped portal output into structured PortalSnapshot.
 */
function normalizeScrapedSnapshot(scraped: any): PortalSnapshot {
  if (!scraped) return { snapshotAt: new Date().toISOString() };

  const courses = (scraped.courses || []).map((c: any) => ({
    code: c.code || c.courseCode || '',
    title: c.name || c.title || c.courseTitle || '',
    examDate: c.examDate || null,
    examTime: c.examTime || null,
    examVenue: c.examVenue || null,
    attendancePercent: c.attendancePercent != null ? Number(c.attendancePercent) : null,
    courseworkMark: c.courseworkMark != null ? Number(c.courseworkMark) : null,
    courseworkTotal: c.courseworkTotal != null ? Number(c.courseworkTotal) : null,
    finalMark: c.finalMark != null ? Number(c.finalMark) : null,
    status: c.status || 'Active',
  }));

  const feeLedger = scraped.feeSummary || scraped.feeLedger ? {
    totalOwed: Number(scraped.feeSummary?.totalInvoiced ?? scraped.feeLedger?.totalOwed ?? 0),
    totalPaid: Number(scraped.feeSummary?.totalPaid ?? scraped.feeLedger?.totalPaid ?? 0),
    balance: Number(scraped.feeSummary?.balance ?? scraped.feeLedger?.balance ?? 0),
    isCleared: Boolean(scraped.feeSummary?.isCleared ?? scraped.feeLedger?.isCleared ?? false),
    prnNumber: scraped.feeSummary?.prnNumber || scraped.feeLedger?.prnNumber || null,
    examPermitIssued: Boolean(scraped.feeSummary?.examPermitIssued ?? scraped.feeLedger?.examPermitIssued ?? false),
    recentPayments: scraped.feeSummary?.recentPayments || scraped.feeLedger?.recentPayments || [],
  } : null;

  return {
    gpa: scraped.student?.gpa != null ? Number(scraped.student.gpa) : null,
    cgpa: scraped.student?.cgpa != null ? Number(scraped.student.cgpa) : null,
    courses,
    feeLedger,
    examPermit: feeLedger?.examPermitIssued ?? false,
    snapshotAt: new Date().toISOString(),
  };
}

/**
 * Execute a single portal check cycle for one student account.
 */
export async function runWatcherCycleForAccount(
  account: ConnectedPortalAccount,
  deps: PortalCronDeps,
  options?: {
    forceDiff?: boolean;
    overrideSnapshot?: PortalSnapshot;
    applyJitter?: boolean;
  }
): Promise<WatcherCycleResult> {
  const profileId = account.profileId;
  const university = account.university || 'ISBAT University';

  // 1. Apply rate-limiting jitter (1.5s - 4.5s) if requested to stagger multi-user polling
  if (options?.applyJitter) {
    const jitterMs = Math.floor(Math.random() * 3000) + 1500;
    console.log(`[PortalWatcher] Jitter pause ${jitterMs}ms for ${account.username} (${university})...`);
    await sleep(jitterMs);
  }

  console.log(`[PortalWatcher] Running check cycle for ${account.username} on ${university}...`);

  // 2. Load previous snapshot
  let previousSnapshot: PortalSnapshot = account.lastSnapshot || { courses: [], feeLedger: null };
  if (deps.supabaseAdmin && profileId) {
    try {
      const { data: rec } = await deps.supabaseAdmin
        .from('student_academic_records')
        .select('snapshot_json, current_gpa, fee_summary')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (rec?.snapshot_json) {
        previousSnapshot = JSON.parse(rec.snapshot_json);
      } else if (rec) {
        // Construct baseline from record fields if snapshot_json not set yet
        previousSnapshot = {
          gpa: rec.current_gpa != null ? Number(rec.current_gpa) : null,
          courses: previousSnapshot.courses || [],
          feeLedger: rec.fee_summary || null,
          snapshotAt: new Date().toISOString(),
        };
      }
    } catch (e: any) {
      console.warn('[PortalWatcher] Could not load previous snapshot from DB:', e.message);
    }
  }

  // 3. Acquire fresh snapshot (via live scrape or options override)
  let freshSnapshot: PortalSnapshot;

  if (options?.overrideSnapshot) {
    freshSnapshot = options.overrideSnapshot;
  } else if (account.username && account.password) {
    try {
      let scrapeResult: any;
      if (university === 'ISBAT University' && deps.authenticateAndFetchHtml) {
        scrapeResult = await deps.authenticateAndFetchHtml(account.username, account.password, {
          mock: Boolean(account.useMock),
          headless: true,
          timeout: 25000,
        });
      } else if (deps.authenticateAndFetchAcmis) {
        scrapeResult = await deps.authenticateAndFetchAcmis(account.username, account.password, {
          university,
          mock: Boolean(account.useMock),
          headless: true,
          timeout: 25000,
        });
      }

      if (scrapeResult && scrapeResult.status === 'success') {
        freshSnapshot = normalizeScrapedSnapshot(scrapeResult);
      } else {
        console.warn(`[PortalWatcher] Scrape failed for ${account.username}:`, scrapeResult?.message);
        freshSnapshot = previousSnapshot;
      }
    } catch (scrapeErr: any) {
      console.warn(`[PortalWatcher] Scraping error for ${account.username}:`, scrapeErr.message);
      freshSnapshot = previousSnapshot;
    }
  } else {
    // If no credentials, use previous snapshot
    freshSnapshot = previousSnapshot;
  }

  // 4. Run Change Detection Engine
  let events = detectPortalChanges(previousSnapshot, freshSnapshot);

  // If forceDiff is enabled for testing and no natural diffs occurred, synthesize verified test diff
  if (options?.forceDiff && events.length === 0) {
    const now = new Date().toISOString();
    events = [
      {
        type: 'EXAM',
        category: 'exam_date_change',
        severity: 'urgent',
        courseCode: 'BIT2201',
        courseTitle: 'Database Systems Architecture',
        title: '🚨 Exam Rescheduled: BIT2201',
        message: 'Exam moved from 2026-10-14 → 2026-10-21 at Main Hall Lab 2. Update your planner!',
        body: 'Exam moved from 2026-10-14 → 2026-10-21 at Main Hall Lab 2. Update your planner!',
        deepLink: '/planner',
        routeHint: 'planner',
        detectedAt: now,
      },
      {
        type: 'FINANCE',
        category: 'fee_status_change',
        severity: 'success',
        title: '✅ Tuition Cleared',
        message: 'Tuition clearance verified: 100% paid for Semester 2. Exam access unlocked.',
        body: 'Tuition clearance verified: 100% paid for Semester 2. Exam access unlocked.',
        deepLink: '/profile',
        routeHint: 'profile',
        detectedAt: now,
      },
      {
        type: 'GRADE',
        category: 'coursework_mark',
        severity: 'success',
        courseCode: 'CS1204',
        courseTitle: 'Data Structures & Algorithms',
        title: '📝 Mark Released: CS1204',
        message: 'Midterm coursework mark published: 38/40.',
        body: 'Midterm coursework mark published: 38/40.',
        deepLink: '/courses',
        routeHint: 'courses',
        detectedAt: now,
      },
    ];
  }

  console.log(
    `[PortalWatcher] Detected ${events.length} change event(s) for ${account.username} (${profileId})`
  );

  // 5. Persist events and dispatch push notifications
  let alertsDispatched = 0;
  for (const event of events) {
    await recordChangeEvent(profileId, event, deps.supabaseAdmin);

    // Send Web Push notification to registered subscriptions
    try {
      const subs = await deps.getSubscriptionsForUser(profileId);
      if (subs.length > 0) {
        const payload = formatPushPayload(event);
        for (const sub of subs) {
          const sent = await deps.sendPushNotification(sub, payload);
          if (sent) alertsDispatched++;
        }
      }
    } catch (pushErr: any) {
      console.warn('[PortalWatcher] Push dispatch error:', pushErr.message);
    }
  }

  // 6. Save fresh snapshot back to DB & memory
  account.lastSnapshot = freshSnapshot;
  account.lastCheckedAt = new Date().toISOString();
  connectedAccounts.set(profileId, account);

  if (deps.supabaseAdmin && profileId && events.length > 0) {
    try {
      await deps.supabaseAdmin
        .from('student_academic_records')
        .update({
          snapshot_json: JSON.stringify(freshSnapshot),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId);
    } catch (dbErr: any) {
      console.warn('[PortalWatcher] Could not update snapshot_json in DB:', dbErr.message);
    }
  }

  return {
    status: 'success',
    profileId,
    university,
    changesDetected: events.length,
    events,
    alertsDispatched,
  };
}

/**
 * Execute check cycles for all connected accounts with staggered jitter.
 */
export async function runAllWatcherCycles(deps: PortalCronDeps): Promise<WatcherCycleResult[]> {
  const accounts = getConnectedAccounts();
  console.log(`[PortalWatcher CRON] Starting scheduled watcher cycle for ${accounts.length} account(s)...`);

  const results: WatcherCycleResult[] = [];
  for (const account of accounts) {
    try {
      const res = await runWatcherCycleForAccount(account, deps, { applyJitter: true });
      results.push(res);
    } catch (err: any) {
      console.error(`[PortalWatcher CRON] Error checking ${account.username}:`, err.message);
    }
  }

  return results;
}

/**
 * Initialize the recurring node-cron background schedule.
 */
export function initPortalWatcherCron(deps: PortalCronDeps) {
  // Default to every 4 hours: '0 */4 * * *', or override via env
  const cronPattern = process.env.PORTAL_WATCHER_CRON || '0 */4 * * *';

  if (!cron.validate(cronPattern)) {
    console.error(`[PortalWatcher] Invalid cron pattern: "${cronPattern}". Defaulting to "0 */4 * * *".`);
  }

  const validPattern = cron.validate(cronPattern) ? cronPattern : '0 */4 * * *';

  console.log(`[PortalWatcher] Initializing background watcher cron with pattern: "${validPattern}"`);

  const task = cron.schedule(validPattern, async () => {
    try {
      await runAllWatcherCycles(deps);
    } catch (err: any) {
      console.error('[PortalWatcher CRON] Cycle failed:', err.message);
    }
  });

  return task;
}
