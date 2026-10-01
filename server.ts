import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { detectPortalChanges, formatPushPayload } from './src/services/portalWatcher.ts';
import {
  initPortalWatcherCron,
  registerPortalWatcherCredential,
  runWatcherCycleForAccount,
  getPastChangeEvents,
  markChangeEventsRead,
} from './src/jobs/portalCron.ts';
import {
  getInstitution,
  getInstitutionByName,
  INSTITUTIONS,
  InstitutionConfig,
} from './src/config/institutions.ts';

dotenv.config();

function resolveInstitutionConfig(institutionId?: string, universityName?: string): InstitutionConfig {
  if (institutionId) {
    try {
      return getInstitution(institutionId);
    } catch {
      // Fall through to university name
    }
  }
  if (universityName) {
    const byName = getInstitutionByName(universityName);
    if (byName) return byName;
  }
  return INSTITUTIONS.find((i) => i.id === 'isbat') ?? INSTITUTIONS[0];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { authenticateAndFetchHtml } = require('./src/scraper.js');
const { authenticateAndFetchAcmis } = require('./src/adapters/acmisAdapter.js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// NOTE: Service Role Key is strictly server-side — never expose to the client.
// Falls back to VITE_SUPABASE_ANON_KEY only in local dev (limited permissions).
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || // ← Production: Cloud Run / Docker secret
  process.env.VITE_SUPABASE_ANON_KEY ||   // ← Dev-only fallback (read-limited)
  '';

const isSupabaseLive = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_URL.includes('xyzcompany')
);

const supabaseAdmin = isSupabaseLive
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

if (isSupabaseLive) {
  console.log(`[Supabase] Connected to: ${SUPABASE_URL}`);
  const usingServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`[Supabase] Key type: ${usingServiceKey ? 'SERVICE ROLE (full RLS bypass)' : 'ANON KEY (limited – dev only)'}`);
} else {
  console.warn('[Supabase] NOT connected – running with in-memory mock cloud state.');
}

// In-memory tenant cloud storage fallback for development / offline guest sessions
const mockCloudState: {
  profiles: Record<string, any>;
  academicRecords: Record<string, any>;
  enrolledCourses: Record<string, any[]>;
  flashcardDecks: Record<string, any[]>;
  tasks: Record<string, any[]>;
} = {
  profiles: {},
  academicRecords: {},
  enrolledCourses: {},
  flashcardDecks: {},
  tasks: {},
};

async function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  if (supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  }

  // If running in local dev / mock mode with mock token
  if (token.startsWith('mock-') || token.startsWith('user-mock-') || token.length > 5) {
    return {
      id: token.replace('Bearer ', ''),
      email: 'student@coursemate.ug',
    };
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '10mb' }));

  // CORS & Preflight handling
  // Allowed origins are set via ALLOWED_ORIGINS env var (comma-separated).
  // Defaults to localhost for development. In production set to your Vercel domain.
  const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:3001';
  const allowedOrigins = new Set(rawOrigins.split(',').map((o) => o.trim()).filter(Boolean));

  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (allowedOrigins.size === 0) {
      // Fallback: open wildcard only when no allowlist is configured (bare dev)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // For same-origin requests (no Origin header) we don't need a CORS header at all.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ==========================================
  // Cloud Sync Route 1: Fetch Full User Cloud State / On-Demand Sync
  // ==========================================
  const handleFetchUserData = async (req: express.Request, res: express.Response) => {
    try {
      const institutionId =
        (req.query.institutionId as string) ||
        (req.body && req.body.institutionId) ||
        (req.headers['x-institution-id'] as string);
      const university =
        (req.query.university as string) ||
        (req.body && req.body.university);
      const username =
        (req.query.username as string) ||
        (req.body && req.body.username);
      const password =
        (req.query.password as string) ||
        (req.body && req.body.password);
      const shouldSync =
        req.query.sync === 'true' ||
        (req.body && (req.body.sync === true || req.body.liveSync === true));

      const instConfig = resolveInstitutionConfig(institutionId, university);

      // If live on-demand portal sync requested via fetch-user-data
      if (shouldSync && username && password) {
        console.log(
          `[API /api/sync/fetch-user-data] Triggering on-demand scrape for institution: ${instConfig.id} (${instConfig.name}) via engine ${instConfig.engine}`
        );
        let scrapeResult;
        if (instConfig.engine === 'ACMIS') {
          scrapeResult = await authenticateAndFetchAcmis(username, password, {
            university: instConfig.name,
            baseUrl: instConfig.portalUrl,
            headless: true,
            timeout: 25000,
          });
        } else {
          scrapeResult = await authenticateAndFetchHtml(username, password, {
            headless: true,
            timeout: 25000,
          });
        }
        if (scrapeResult && scrapeResult.status === 'success') {
          return res.status(200).json(scrapeResult);
        } else if (scrapeResult && scrapeResult.status === 'error') {
          return res.status(401).json(scrapeResult);
        }
      }

      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(200).json({
          status: 'empty',
          message: 'No active authenticated user session found. Retaining local state.',
          institution: instConfig,
        });
      }

      console.log(`[API /api/sync/fetch-user-data] Fetching cloud data for user: ${user.id}`);

      if (supabaseAdmin) {
        // 1. Fetch Profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // 2. Fetch Academic Records
        const { data: academicRecord } = await supabaseAdmin
          .from('student_academic_records')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        // 3. Fetch Enrolled Courses
        const { data: courses } = await supabaseAdmin
          .from('enrolled_courses')
          .select('*')
          .eq('profile_id', user.id);

        // 4. Fetch Flashcard Decks
        const { data: flashcardDecks } = await supabaseAdmin
          .from('flashcard_decks')
          .select('*')
          .eq('profile_id', user.id);

        // 5. Fetch Tasks and Deadlines
        const { data: tasks } = await supabaseAdmin
          .from('tasks_and_deadlines')
          .select('*')
          .eq('profile_id', user.id);

        // Format mapped response
        const mappedStudent = academicRecord
          ? {
              name: academicRecord.student_name,
              preferredName: academicRecord.preferred_name,
              studentId: academicRecord.student_id,
              regNumber: academicRecord.reg_number,
              university: academicRecord.university,
              faculty: academicRecord.faculty,
              programme: academicRecord.programme,
              semesterName: academicRecord.semester_name,
              academicStatus: academicRecord.academic_status,
              year: academicRecord.year,
              semester: academicRecord.semester,
              currentGpa: Number(academicRecord.current_gpa) || 4.25,
              studyStreakDays: academicRecord.study_streak_days || 8,
              weeklyStudyHoursGoal: Number(academicRecord.weekly_study_hours_goal) || 20,
              weeklyStudyHoursLogged: Number(academicRecord.weekly_study_hours_logged) || 14.5,
              xpPoints: profile?.xp_points || 1240,
              isSynced: academicRecord.is_synced,
              syncedAt: academicRecord.last_synced_at,
              feeSummary: academicRecord.fee_summary,
            }
          : undefined;

        const mappedCourses = (courses || []).map((c: any) => ({
          id: c.course_code.toLowerCase(),
          code: c.course_code,
          name: c.course_title,
          creditUnits: c.credit_units,
          credits: c.credit_units,
          lecturer: c.lecturer,
          room: c.room,
          color: c.color,
          nextClass: c.next_class,
          progressPct: c.progress_pct,
          gradeEstimate: c.grade_estimate,
          upcomingAssignments: c.upcoming_assignments,
          upcomingTests: c.upcoming_tests,
          materialsCount: c.materials_count,
          syllabusTopics: c.syllabus_topics,
          timetable: c.timetable,
          assessments: c.assessments,
        }));

        const mappedEvents = (tasks || []).map((t: any) => ({
          id: t.id || `task-${Date.now()}`,
          title: t.title,
          courseCode: t.course_code,
          type: t.type || 'assignment',
          date: t.date,
          startTime: t.start_time || '23:59',
          endTime: t.end_time || '23:59',
          location: t.location,
          completed: t.completed,
          weightPct: t.weight_pct,
          source: {
            type: 'cloud_sync',
            label: 'Supabase Cloud Sync',
            verified: true,
          },
        }));

        return res.status(200).json({
          status: 'success',
          profile: profile
            ? {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                selectedUniversity: profile.selected_university,
                xpPoints: profile.xp_points,
              }
            : undefined,
          student: mappedStudent,
          courses: mappedCourses,
          events: mappedEvents,
          flashcardDecks: (flashcardDecks || []).map((d: any) => ({
            id: d.id,
            courseCode: d.course_code,
            title: d.title,
            cards: d.flashcards || [],
          })),
          feeSummary: academicRecord?.fee_summary,
        });
      }

      // Local mock fallback if Supabase credentials are not connected
      const mockUserKey = user.id;
      return res.status(200).json({
        status: 'success',
        profile: mockCloudState.profiles[mockUserKey],
        student: mockCloudState.academicRecords[mockUserKey],
        courses: mockCloudState.enrolledCourses[mockUserKey] || [],
        events: mockCloudState.tasks[mockUserKey] || [],
        flashcardDecks: mockCloudState.flashcardDecks[mockUserKey] || [],
        feeSummary: mockCloudState.academicRecords[mockUserKey]?.feeSummary,
        mock: true,
      });
    } catch (err: any) {
      console.error('[API /api/sync/fetch-user-data Error]:', err.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch cloud user data: ' + err.message,
      });
    }
  };

  app.get('/api/sync/fetch-user-data', handleFetchUserData);
  app.post('/api/sync/fetch-user-data', handleFetchUserData);

  // ==========================================
  // Cloud Sync Route 2: Persist Scraped Academic Data (PostgreSQL Upsert)
  // ==========================================
  app.post('/api/sync/persist-academic-data', async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { university = 'ISBAT University', student = {}, courses = [], feeSummary, events = [] } = req.body || {};

      console.log(
        `[API /api/sync/persist-academic-data] Persisting data for university: "${university}", user: ${
          user ? user.id : 'guest/mock'
        }, courses: ${courses.length}`
      );

      const userId = user ? user.id : 'guest-user-default';

      if (supabaseAdmin && user) {
        // 1. Upsert Profile
        await supabaseAdmin.from('profiles').upsert(
          {
            id: user.id,
            email: user.email || 'student@coursemate.ug',
            full_name: student.name || 'CourseMate Student',
            selected_university: university,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        // 2. Upsert Academic Record
        await supabaseAdmin.from('student_academic_records').upsert(
          {
            profile_id: user.id,
            university,
            student_name: student.name || 'BUSINGE SAMUEL',
            preferred_name: student.preferredName || 'Samuel',
            student_id: student.studentId || 'HECS26DA',
            reg_number: student.regNumber || 'HECS26DA',
            faculty: student.faculty,
            programme: student.programme,
            semester_name: student.semesterName || 'Year One - Semester Two',
            academic_status: student.academicStatus || 'Active',
            year: student.year || 1,
            semester: student.semester || 2,
            current_gpa: student.currentGpa || 4.25,
            study_streak_days: student.studyStreakDays || 8,
            weekly_study_hours_goal: student.weeklyStudyHoursGoal || 20,
            weekly_study_hours_logged: student.weeklyStudyHoursLogged || 14.5,
            fee_summary: feeSummary || student.feeSummary || {},
            is_synced: true,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,university' }
        );

        // 3. Upsert Enrolled Courses
        if (courses.length > 0) {
          const coursesRows = courses.map((c: any) => ({
            profile_id: user.id,
            university,
            course_code: c.code,
            course_title: c.name || c.title || c.code,
            credit_units: c.creditUnits || c.credits || 3,
            lecturer: c.lecturer || `${university} Faculty`,
            room: c.room,
            color: c.color || '#8B5CF6',
            next_class: c.nextClass,
            progress_pct: c.progressPct || 50,
            grade_estimate: c.gradeEstimate || 'In Progress',
            upcoming_assignments: c.upcomingAssignments || 0,
            upcoming_tests: c.upcomingTests || 0,
            materials_count: c.materialsCount || 12,
            syllabus_topics: c.syllabusTopics || [],
            timetable: c.timetable || {},
            assessments: c.assessments || {},
            updated_at: new Date().toISOString(),
          }));

          await supabaseAdmin
            .from('enrolled_courses')
            .upsert(coursesRows, { onConflict: 'profile_id,university,course_code' });
        }

        // 4. Upsert Tasks & Events (Exams & Assignments)
        if (events.length > 0) {
          const taskRows = events.map((e: any) => ({
            profile_id: user.id,
            university,
            course_code: e.courseCode || '',
            title: e.title,
            date: e.date,
            start_time: e.startTime,
            end_time: e.endTime,
            location: e.location,
            type: e.type || 'assignment',
            completed: Boolean(e.completed),
            weight_pct: e.weightPct || 15,
            updated_at: new Date().toISOString(),
          }));

          await supabaseAdmin
            .from('tasks_and_deadlines')
            .upsert(taskRows);
        }
      } else {
        // Save to in-memory store for guest/dev session
        mockCloudState.profiles[userId] = {
          id: userId,
          email: user?.email || 'guest@coursemate.ug',
          fullName: student.name || 'CourseMate Student',
          selectedUniversity: university,
        };
        mockCloudState.academicRecords[userId] = {
          ...student,
          university,
          feeSummary,
          isSynced: true,
        };
        mockCloudState.enrolledCourses[userId] = courses;
        mockCloudState.tasks[userId] = events;
      }

      return res.status(200).json({
        status: 'success',
        message: 'Academic data saved and synced to PostgreSQL',
        syncedCount: courses.length,
      });
    } catch (err: any) {
      console.error('[API /api/sync/persist-academic-data Error]:', err.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to persist academic data: ' + err.message,
      });
    }
  });

  // ==========================================
  // Cloud Sync Route 3: Save AI Flashcards & Study Material
  // ==========================================
  app.post('/api/sync/save-study-material', async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { university = 'ISBAT University', type = 'flashcard_deck', deck, decks, event } = req.body || {};
      const userId = user ? user.id : 'guest-user-default';

      if (supabaseAdmin && user) {
        if (type === 'flashcard_deck' && deck) {
          await supabaseAdmin.from('flashcard_decks').upsert(
            {
              profile_id: user.id,
              university,
              course_code: deck.courseCode || 'GENERAL',
              title: deck.title || 'Flashcard Deck',
              flashcards: deck.cards || [],
              cards_count: deck.cards?.length || 0,
              mastered_count: (deck.cards || []).filter((c: any) => c.mastered).length,
              last_reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          );
        } else if (type === 'all_decks' && Array.isArray(decks)) {
          const rows = decks.map((d: any) => ({
            profile_id: user.id,
            university,
            course_code: d.courseCode || 'GENERAL',
            title: d.title || 'Flashcard Deck',
            flashcards: d.cards || [],
            cards_count: d.cards?.length || 0,
            mastered_count: (d.cards || []).filter((c: any) => c.mastered).length,
            updated_at: new Date().toISOString(),
          }));
          await supabaseAdmin.from('flashcard_decks').upsert(rows);
        } else if (type === 'task' && event) {
          await supabaseAdmin.from('tasks_and_deadlines').upsert({
            profile_id: user.id,
            university,
            course_code: event.courseCode || '',
            title: event.title,
            date: event.date,
            start_time: event.startTime,
            end_time: event.endTime,
            location: event.location,
            type: event.type || 'assignment',
            completed: Boolean(event.completed),
            weight_pct: event.weightPct || 15,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        if (type === 'flashcard_deck' && deck) {
          const existing = mockCloudState.flashcardDecks[userId] || [];
          const idx = existing.findIndex((d) => d.id === deck.id || d.title === deck.title);
          if (idx >= 0) existing[idx] = deck;
          else existing.push(deck);
          mockCloudState.flashcardDecks[userId] = existing;
        } else if (type === 'all_decks' && Array.isArray(decks)) {
          mockCloudState.flashcardDecks[userId] = decks;
        } else if (type === 'task' && event) {
          const existing = mockCloudState.tasks[userId] || [];
          existing.unshift(event);
          mockCloudState.tasks[userId] = existing;
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'Study material saved to cloud',
      });
    } catch (err: any) {
      console.error('[API /api/sync/save-study-material Error]:', err.message);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save study material: ' + err.message,
      });
    }
  });

  // ==========================================
  // 0. University Portal Sync Bridge (ISBAT ISMIS & National ACMIS)
  // Endpoints: /api/sync-portal, /api/sync/portal, /api/scrape/run
  // ==========================================
  const handleScrapeOrSyncPortal = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password, useMock, mock, university = 'ISBAT University', institutionId } = req.body || {};
      const isMock = Boolean(mock ?? useMock);

      const instConfig = resolveInstitutionConfig(institutionId, university);
      const engine = instConfig.engine;
      const targetUniName = instConfig.name;
      const targetBaseUrl = instConfig.portalUrl;

      console.log(
        `[Scraping Bridge] Processing sync request (Institution: "${instConfig.id}", Engine: "${engine}", University: "${targetUniName}", BaseUrl: "${targetBaseUrl}", User: "${
          username ? username.substring(0, 3) + '***' : 'none'
        }", isMock: ${isMock})`
      );

      let result;

      if (engine === 'ISMIS') {
        if (!isMock && (!username || !password)) {
          return res.status(400).json({
            status: 'error',
            message: `Both ${instConfig.credentialFields.usernameLabel} and ${instConfig.credentialFields.passwordLabel} are required to sync with ${targetUniName}.`
          });
        }

        // Call working ISBAT Playwright scraping engine
        result = await authenticateAndFetchHtml(username, password, {
          mock: isMock,
          headless: true,
          timeout: 25000
        });
      } else {
        // ACMIS Portal Adapter: Makerere University, Kyambogo University, MUBS
        if (!isMock && (!username || !password)) {
          return res.status(400).json({
            status: 'error',
            message: `Both ${instConfig.credentialFields.usernameLabel} and ${instConfig.credentialFields.passwordLabel} are required to sync with ${targetUniName} ACMIS portal.`
          });
        }

        result = await authenticateAndFetchAcmis(username, password, {
          university: targetUniName,
          baseUrl: targetBaseUrl,
          mock: isMock,
          headless: true,
          timeout: 25000
        });
      }

      if (result && result.status === 'success') {
        console.log(
          `[Scraping Bridge] ✓ Successfully synced ${targetUniName} portal data for: ${
            result.student ? result.student.name : 'Student'
          }`
        );

        // Auto-register connected credentials for the background watcher cron engine
        try {
          const authUser = await getAuthenticatedUser(req).catch(() => null);
          const pId = authUser?.id || (result.student?.regNumber ? `student-${result.student.regNumber}` : 'demo-student-profile');
          registerPortalWatcherCredential({
            profileId: pId,
            university: targetUniName,
            username: username || (result.student?.regNumber ?? 'student'),
            password: password || '',
            useMock: isMock,
            lastCheckedAt: new Date().toISOString(),
          });
        } catch (regErr: any) {
          console.warn('[PortalWatcher] Could not auto-register watcher credentials:', regErr.message);
        }

        return res.status(200).json({
          ...result,
          institutionId: instConfig.id,
          engine,
        });
      } else {
        const failureMsg =
          result && result.message
            ? result.message
            : `Invalid student credentials for ${targetUniName}. Please verify your details.`;

        console.warn(`[Scraping Bridge] ✗ Sync rejected for ${targetUniName}: ${failureMsg}`);
        return res.status(401).json({
          status: 'error',
          message: failureMsg
        });
      }
    } catch (err: any) {
      console.error('[Scraping Bridge Error]:', err.message);
      return res.status(500).json({
        status: 'error',
        message: 'Server error while contacting student portal: ' + err.message
      });
    }
  };

  app.post('/api/sync-portal', handleScrapeOrSyncPortal);
  app.post('/api/sync/portal', handleScrapeOrSyncPortal);
  app.post('/api/scrape/run', handleScrapeOrSyncPortal);

  // ==========================================
  // Diagnostic: POST /api/scrape/test-connection
  // Settings panel "Test Portal Connection" button — verifies credentials,
  // captures session headers, and returns a clean structured result.
  // ==========================================
  app.post('/api/scrape/test-connection', async (req, res) => {
    const startMs = Date.now();
    try {
      const { username, password, university = 'ISBAT University', institutionId } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Both username and password are required.',
        });
      }

      const instConfig = resolveInstitutionConfig(institutionId, university);
      const engine = instConfig.engine;
      const targetUniName = instConfig.name;
      const targetBaseUrl = instConfig.portalUrl;

      console.log(
        `[ScrapeDiagnostic] Testing connection (Institution: "${instConfig.id}", Engine: "${engine}", University: "${targetUniName}", BaseUrl: "${targetBaseUrl}", User: "${
          username.substring(0, 3)
        }***")`
      );

      let result: any;
      try {
        if (engine === 'ISMIS') {
          result = await authenticateAndFetchHtml(username, password, {
            mock: false,
            headless: true,
            timeout: 15000,
          });
        } else {
          result = await authenticateAndFetchAcmis(username, password, {
            university: targetUniName,
            baseUrl: targetBaseUrl,
            mock: false,
            headless: true,
            timeout: 15000,
          });
        }
      } catch (scraperErr: any) {
        // Playwright / network-level error (not an auth rejection)
        const latencyMs = Date.now() - startMs;
        console.warn('[ScrapeDiagnostic] Scraper threw:', scraperErr.message);
        return res.status(200).json({
          success: false,
          error: scraperErr.message?.includes('timeout')
            ? `Portal did not respond within 15 seconds. The ${targetUniName} server may be under maintenance.`
            : `Could not reach the ${targetUniName} portal: ${scraperErr.message}`,
          latencyMs,
        });
      }

      const latencyMs = Date.now() - startMs;

      if (result?.status === 'success' && result?.student) {
        const { student, courses = [] } = result;
        console.log(
          `[ScrapeDiagnostic] ✅ Connection verified in ${latencyMs}ms — ${student.name || 'Student'}, ${courses.length} courses`
        );
        return res.status(200).json({
          success: true,
          studentName: student.name || student.studentName || 'Unknown',
          regNo: student.regNumber || student.studentId || 'N/A',
          coursesFound: courses.length,
          university: targetUniName,
          institutionId: instConfig.id,
          engine,
          latencyMs,
        });
      }

      // Auth rejection from the portal (invalid credentials, account locked, etc.)
      const rejectionReason =
        result?.message ||
        `Invalid credentials for ${targetUniName}. Check your ${instConfig.credentialFields.usernameLabel.toLowerCase()} and password.`;

      console.warn(`[ScrapeDiagnostic] ✗ Auth failed for ${targetUniName} (${latencyMs}ms):`, rejectionReason);
      return res.status(200).json({
        success: false,
        error: rejectionReason,
        latencyMs,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;
      console.error('[ScrapeDiagnostic Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: `Diagnostic error: ${err.message}`,
        latencyMs,
      });
    }
  });

  // ==========================================
  // Cache-and-Sync Bridge: POST /api/trigger-scrape
  //
  // Called by the client when the Supabase grades/courses cache is empty for a
  // given student_id. This endpoint:
  //   1. Looks up the student's portal credentials from student_academic_records.
  //   2. Dispatches a background Playwright scrape (non-blocking — responds 202).
  //   3. Upserts freshly scraped rows into enrolled_courses + student_academic_records
  //      so that the Supabase Realtime subscription in the client fires automatically.
  //
  // Auth: requires a valid Bearer token (same as the rest of the sync routes).
  // ==========================================
  app.post('/api/trigger-scrape', async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
      }

      const {
        student_id,
        university = 'ISBAT University',
        institutionId,
        // Optional: caller may pass credentials directly (e.g. from onboarding flow).
        // If omitted, the server attempts to retrieve them from the DB record.
        username: callerUsername,
        password: callerPassword,
        useMock = false,
      } = req.body || {};

      const instConfig = resolveInstitutionConfig(institutionId, university);

      console.log(
        `[TriggerScrape] Received scrape request — student_id: "${student_id}", university: "${instConfig.name}", user: ${user.id}, mock: ${useMock}`
      );

      // Resolve credentials: prefer caller-supplied, fall back to DB record.
      let portalUsername = callerUsername || '';
      let portalPassword = callerPassword || '';

      if (supabaseAdmin && (!portalUsername || !portalPassword)) {
        const { data: record } = await supabaseAdmin
          .from('student_academic_records')
          .select('student_id, reg_number')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (record) {
          // Use reg_number / student_id as the portal username when no explicit
          // credentials are provided (mock-safe: portal will use student_id as login).
          portalUsername = portalUsername || record.reg_number || record.student_id || student_id || '';
        }
      }

      // Respond immediately — scraping is asynchronous. The Realtime subscription
      // on the client side will pick up DB changes as they land.
      res.status(202).json({
        status: 'accepted',
        message: 'Scrape job dispatched. Results will be streamed via Supabase Realtime.',
        student_id: student_id || portalUsername,
        university: instConfig.name,
      });

      // ── Background Scrape ──────────────────────────────────────────────────
      (async () => {
        try {
          console.log(`[TriggerScrape] Starting background scrape (engine: ${instConfig.engine}, user: ${user.id})`);

          let scrapeResult: any;

          if (instConfig.engine === 'ACMIS') {
            scrapeResult = await authenticateAndFetchAcmis(portalUsername, portalPassword, {
              university: instConfig.name,
              baseUrl: instConfig.portalUrl,
              mock: useMock,
              headless: true,
              timeout: 30000,
            });
          } else {
            // ISMIS (ISBAT)
            scrapeResult = await authenticateAndFetchHtml(portalUsername, portalPassword, {
              mock: useMock,
              headless: true,
              timeout: 30000,
            });
          }

          if (!scrapeResult || scrapeResult.status !== 'success') {
            console.warn(`[TriggerScrape] Scrape failed for user ${user.id}:`, scrapeResult?.message);
            return;
          }

          console.log(`[TriggerScrape] Scrape succeeded for user ${user.id}. Upserting to Supabase...`);

          if (!supabaseAdmin) {
            console.warn('[TriggerScrape] supabaseAdmin not available – skipping DB upsert.');
            return;
          }

          const { student: rawStudent = {}, courses: coursesList = [], feeSummary } = scrapeResult;

          // 1. Upsert profile
          await supabaseAdmin.from('profiles').upsert(
            {
              id: user.id,
              email: user.email || 'student@coursemate.ug',
              full_name: rawStudent.name || 'CourseMate Student',
              selected_university: instConfig.name,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          // 2. Upsert student_academic_records — Realtime fires here for the student row.
          await supabaseAdmin.from('student_academic_records').upsert(
            {
              profile_id: user.id,
              university: instConfig.name,
              student_name: rawStudent.name || 'Student',
              preferred_name: (rawStudent.name || 'Student').split(' ')[0],
              student_id: rawStudent.studentId || rawStudent.regNumber || student_id || portalUsername,
              reg_number: rawStudent.regNumber || rawStudent.studentId || student_id || portalUsername,
              faculty: rawStudent.faculty || `${instConfig.name} Faculty`,
              programme: rawStudent.programme || rawStudent.program || 'Certificate Programme',
              semester_name: rawStudent.semester || rawStudent.semesterName || 'Year One - Semester Two',
              academic_status: rawStudent.academicStatus || 'Active',
              year: rawStudent.year || 1,
              semester: 2,
              current_gpa: rawStudent.currentGpa || 0,
              fee_summary: feeSummary || {},
              is_synced: true,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'profile_id,university' }
          );

          // 3. Upsert enrolled_courses — Realtime fires here for each course row.
          if (coursesList.length > 0) {
            const colors = ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
            const courseRows = coursesList.map((c: any, idx: number) => ({
              profile_id: user.id,
              university: instConfig.name,
              course_code: c.code,
              course_title: c.title || c.name || c.code,
              credit_units: c.creditUnits || c.credits || 3,
              lecturer: c.lecturer || `${instConfig.name} Faculty`,
              room: c.room || `Lab ${idx + 1} / Main Campus`,
              color: c.color || colors[idx % colors.length],
              next_class: c.nextClass || (idx === 0 ? 'Today · 09:00' : 'Tomorrow · 11:00'),
              progress_pct: c.progressPct ?? 50,
              grade_estimate: c.grade || c.gradeEstimate || 'In Progress',
              upcoming_assignments: c.upcomingAssignments ?? 1,
              upcoming_tests: c.upcomingTests ?? (c.timetable?.examDate && c.timetable.examDate !== 'Not Yet Scheduled' ? 1 : 0),
              materials_count: c.materialsCount ?? 12,
              syllabus_topics: c.syllabusTopics || [],
              timetable: c.timetable || {},
              assessments: c.assessments || {},
              updated_at: new Date().toISOString(),
            }));

            await supabaseAdmin
              .from('enrolled_courses')
              .upsert(courseRows, { onConflict: 'profile_id,university,course_code' });
          }

          console.log(
            `[TriggerScrape] ✓ DB upsert complete for user ${user.id} — ${coursesList.length} courses, student row updated.`
          );
        } catch (bgErr: any) {
          console.error('[TriggerScrape] Background scrape error:', bgErr.message);
        }
      })();
    } catch (err: any) {
      console.error('[TriggerScrape] Handler error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });


  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // ==========================================
  // Core: Unified Gemini AI Study Material Generator
  // ==========================================
  app.post('/api/ai/generate-study-material', async (req, res) => {
    try {
      const { courseCode = 'HEC1207', courseTitle = '', type = 'flashcards', topic } = req.body || {};
      const targetTopic = topic || `${courseTitle || courseCode} Core Mastery & Revision`;

      // Helper for curriculum fallback data tailored to university course codes
      const getCurriculumFallback = () => {
        const codeUpper = String(courseCode).toUpperCase();
        if (type === 'quiz') {
          let questions = [
            {
              id: 'q-1',
              question: `In ${codeUpper} (${courseTitle || 'Curriculum'}), what is the foundational principle behind ${targetTopic}?`,
              options: [
                'Maintaining invariant constraints and formal verification',
                'Arbitrary heuristic guesswork without bounds',
                'Unchecked memory allocation and unbuffered I/O',
                'Manual procedural overrides without logging',
              ],
              correctIndex: 0,
              explanation: `In ${codeUpper}, formal invariant management ensures operational correctness and optimal performance.`,
            },
            {
              id: 'q-2',
              question: `Which strategy yields the most efficient time complexity when processing ${targetTopic}?`,
              options: [
                'Logarithmic or linear divide-and-conquer decomposition',
                'Exponential brute-force exhaustive search',
                'Randomized unindexed polling',
                'Quadratic nested iteration without memoization',
              ],
              correctIndex: 0,
              explanation: 'Divide-and-conquer reduces subproblem overhead and prevents unnecessary exponential expansion.',
            },
            {
              id: 'q-3',
              question: `Why is active recall and testing critical for ${codeUpper} exam preparation?`,
              options: [
                'It stimulates retrieval pathways and solidifies long-term retention',
                'It replaces the need to attend lectures or complete coursework',
                'It guarantees that questions will be worded identically on the test',
                'It is only useful for passive memorization',
              ],
              correctIndex: 0,
              explanation: 'Active recall forces the brain to retrieve information from memory, strengthening cognitive retention under exam conditions.',
            },
          ];

          if (codeUpper.includes('1207') || codeUpper.includes('CSC2100')) {
            questions = [
              {
                id: 'q-1',
                question: 'What is the primary advantage of binary search over linear sequential search?',
                options: [
                  'O(log n) time complexity by halving search space at each comparison',
                  'It works on completely unsorted arbitrary linked lists',
                  'It uses less cache memory than linear scan',
                  'It executes in O(1) constant time regardless of collection size',
                ],
                correctIndex: 0,
                explanation: 'Binary search requires sorted data and eliminates half of the remaining elements at each step, achieving logarithmic O(log n) performance.',
              },
              {
                id: 'q-2',
                question: 'In computer architecture and boolean logic, what does De Morgan\'s Law state regarding NAND operations?',
                options: [
                  'NOT(A AND B) is logically equivalent to (NOT A) OR (NOT B)',
                  'NOT(A OR B) is equal to (NOT A) OR (NOT B)',
                  'A AND B is always equal to A OR B',
                  'NAND gates cannot be combined to form universal logic',
                ],
                correctIndex: 0,
                explanation: 'De Morgan\'s Laws prove that negating a conjunction is equivalent to disjunction of the negations: !(A && B) == (!A || !B).',
              },
              {
                id: 'q-3',
                question: 'What distinguishes a Stack from a Queue in fundamental data structures?',
                options: [
                  'Stack is LIFO (Last-In-First-Out) while Queue is FIFO (First-In-First-Out)',
                  'Queue is LIFO while Stack is FIFO',
                  'Stacks cannot store primitive data types',
                  'Queues require contiguous memory while Stacks always use disk storage',
                ],
                correctIndex: 0,
                explanation: 'A stack inserts and removes from the top (LIFO), whereas a queue enqueues at the rear and dequeues at the front (FIFO).',
              },
            ];
          }

          return {
            success: true,
            status: 'success',
            type: 'quiz',
            courseCode: codeUpper,
            courseTitle: courseTitle || codeUpper,
            items: questions,
            quiz: {
              id: `quiz-ai-${Date.now()}`,
              courseCode: codeUpper,
              title: `${codeUpper} Rapid Drill: ${targetTopic}`,
              estimatedMinutes: 5,
              questions,
            },
            isFallback: true,
          };
        } else if (type === 'flashcards') {
          let cards = [
            {
              id: 'card-1',
              front: `What is the core definition and theoretical objective of ${targetTopic}?`,
              back: `To establish systematic, correct, and verifiable models for problem-solving in ${codeUpper}.`,
              hint: 'Think of structural rules and preconditions.',
              mastered: false,
            },
            {
              id: 'card-2',
              front: `What are the critical performance trade-offs encountered in ${targetTopic}?`,
              back: `Space complexity overhead (memory footprint) vs execution speed and implementation simplicity.`,
              hint: 'Consider asymptotic time/space bounds.',
              mastered: false,
            },
            {
              id: 'card-3',
              front: `How do practitioners handle edge cases and failure modes in ${targetTopic}?`,
              back: `By asserting invariants, guarding null/boundary conditions, and validating inputs before state mutation.`,
              hint: 'Boundary checks and defensive design.',
              mastered: false,
            },
            {
              id: 'card-4',
              front: `How is ${targetTopic} typically tested in semester examinations?`,
              back: `Through multi-part analysis requiring definition, diagrammatic tracing, mathematical justification, and code implementation.`,
              hint: 'Look at past paper section B questions.',
              mastered: false,
            },
          ];

          if (codeUpper.includes('1207') || codeUpper.includes('CSC2100')) {
            cards = [
              {
                id: 'card-1',
                front: 'Explain the difference between Call-by-Value and Call-by-Reference in memory execution.',
                back: 'Call-by-Value copies the argument value into a new memory location. Call-by-Reference passes the actual memory address, so mutations affect the original variable.',
                hint: 'Pointer vs copy semantics',
                mastered: false,
              },
              {
                id: 'card-2',
                front: 'What is the Worst-Case Time Complexity of Quicksort, and how is it mitigated?',
                back: 'O(n²) when the pivot chosen is consistently the smallest or largest element. Mitigated using randomized pivot selection or Median-of-Three partitioning.',
                hint: 'Pivot degradation to O(n²)',
                mastered: false,
              },
              {
                id: 'card-3',
                front: 'What are the three essential components of the Von Neumann Architecture?',
                back: '1. Central Processing Unit (ALU + Control Unit + Registers)\n2. Memory Unit (RAM storing both data & instructions)\n3. Input/Output Mechanisms.',
                hint: 'Stored-program concept',
                mastered: false,
              },
              {
                id: 'card-4',
                front: 'What is a Hash Collision, and what are the two primary resolution strategies?',
                back: 'Occurs when two distinct keys hash to the same table index. Resolved by:\n1. Separate Chaining (linked lists or BSTs at each bucket)\n2. Open Addressing (linear probing, quadratic probing, double hashing).',
                hint: 'Chaining vs Probing',
                mastered: false,
              },
            ];
          }

          return {
            success: true,
            status: 'success',
            type: 'flashcards',
            courseCode: codeUpper,
            courseTitle: courseTitle || codeUpper,
            items: cards,
            deck: {
              id: `deck-ai-${Date.now()}`,
              courseCode: codeUpper,
              courseName: courseTitle || codeUpper,
              title: `${codeUpper} AI Recall: ${targetTopic}`,
              cards,
            },
            isFallback: true,
          };
        } else {
          return {
            success: true,
            status: 'success',
            type: 'explain',
            courseCode: codeUpper,
            explanation: `In ${codeUpper}, ${targetTopic} is a key concept that bridges theoretical abstractions with concrete implementations.`,
            keyTakeaways: [
              'Understand the core invariant and structural rules',
              'Analyze the asymptotic complexity bounds',
              'Practice tracing state transitions step-by-step',
            ],
            practicePrompt: `Explain the fundamental trade-off of ${targetTopic} in two sentences.`,
            isFallback: true,
          };
        }
      };

      // If no API key or invalid format, return rich fallback immediately without throwing
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_') || process.env.GEMINI_API_KEY.length < 10) {
        return res.json(getCurriculumFallback());
      }

      // Call Gemini AI via @google/genai
      try {
        const systemInstruction = 'You are CourseMate AI, an expert university tutor. Produce rigorous, high-yield active-recall study flashcards or 3-question rapid assessment quizzes tailored to the course syllabus. Return strict JSON matching our frontend deck/quiz schema.';

        if (type === 'quiz') {
          const prompt = `${systemInstruction}\nGenerate a 3-question rapid assessment quiz for university students studying ${courseCode} (${courseTitle}): "${targetTopic}".
Provide 4 plausible multiple-choice options for each question with 1 correct option (0-indexed correctIndex) and a clear educational explanation.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                      },
                      required: ['question', 'options', 'correctIndex', 'explanation'],
                    },
                  },
                },
                required: ['title', 'questions'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          const quizQuestions = (parsed.questions || []).map((q: any, i: number) => ({
            id: `q-${i + 1}`,
            ...q,
          }));
          return res.json({
            success: true,
            status: 'success',
            type: 'quiz',
            courseCode,
            courseTitle,
            items: quizQuestions,
            quiz: {
              id: `quiz-ai-${Date.now()}`,
              courseCode,
              title: parsed.title || `${courseCode} Rapid Drill: ${targetTopic}`,
              estimatedMinutes: 5,
              questions: quizQuestions,
            },
            isFallback: false,
          });
        } else if (type === 'flashcards') {
          const prompt = `${systemInstruction}\nGenerate 4 high-yield active-recall flashcards for university students studying ${courseCode} (${courseTitle}): "${targetTopic}".
Each flashcard must contain front (concise question/concept), back (rigorous explanation & reasoning), and hint (helpful memory cue).`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  deckTitle: { type: Type.STRING },
                  cards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        front: { type: Type.STRING },
                        back: { type: Type.STRING },
                        hint: { type: Type.STRING },
                      },
                      required: ['front', 'back'],
                    },
                  },
                },
                required: ['deckTitle', 'cards'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          const flashcards = (parsed.cards || []).map((c: any, i: number) => ({
            id: `card-${i + 1}`,
            front: c.front,
            back: c.back,
            hint: c.hint || '',
            mastered: false,
          }));
          return res.json({
            success: true,
            status: 'success',
            type: 'flashcards',
            courseCode,
            courseTitle,
            items: flashcards,
            deck: {
              id: `deck-ai-${Date.now()}`,
              courseCode,
              courseName: courseTitle || courseCode,
              title: parsed.deckTitle || `${courseCode} AI Recall: ${targetTopic}`,
              cards: flashcards,
            },
            isFallback: false,
          });
        } else {
          // 'explain'
          const prompt = `${systemInstruction}\nExplain the topic "${targetTopic}" in course "${courseCode} (${courseTitle})".`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  explanation: { type: Type.STRING },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  practicePrompt: { type: Type.STRING },
                },
                required: ['explanation', 'keyTakeaways', 'practicePrompt'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          return res.json({
            success: true,
            status: 'success',
            type: 'explain',
            courseCode,
            ...parsed,
            isFallback: false,
          });
        }
      } catch (geminiError: any) {
        console.warn(`[Gemini API Warning]: ${geminiError.message}. Serving high-yield fallback.`);
        return res.json(getCurriculumFallback());
      }
    } catch (err: any) {
      console.error('[API /api/ai/generate-study-material Error]:', err);
      // Graceful fallback instead of 500 error
      return res.status(200).json({
        status: 'success',
        type: req.body?.type || 'flashcards',
        isFallback: true,
        deck: {
          id: `deck-fallback-${Date.now()}`,
          courseCode: req.body?.courseCode || 'HEC1207',
          courseName: req.body?.courseTitle || 'Foundations',
          title: 'Core Concepts & Exam Revision',
          cards: [
            {
              id: 'c-1',
              front: 'What are the critical exam topics for this course unit?',
              back: 'Core architectural principles, mathematical justifications, and applied algorithms.',
              hint: 'Review past exam papers',
              mastered: false,
            },
          ],
        },
      });
    }
  });

  // 1. AI Concept Explainer ("Explain this topic to a university student")
  app.post('/api/ai/explain-topic', async (req, res) => {
    try {
      const { courseCode, topic, context } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        // High quality fallback if key not configured
        return res.json({
          topic,
          courseCode: courseCode || 'General',
          explanation: `In ${courseCode || 'Computer Science'}, ${topic} is fundamental. Key concept: break the problem into invariants, trace base cases, and analyze asymptotic guarantees.`,
          keyTakeaways: [
            'Master the core invariants and structural rules',
            'Memorize worst-case and average-case time/space bounds',
            'Practice active recall by drawing the operations on scratch paper',
          ],
          practicePrompt: `How would you explain the trade-offs of ${topic} to an interviewer in 2 minutes?`,
          isFallback: true,
        });
      }

      const prompt = `You are CourseMate's personal academic study companion for a university computer science & engineering student.
Explain the topic "${topic}" in course "${courseCode || 'Undergraduate STEM'}".
Additional context: ${context || 'Undergraduate course'}.

Format your response strictly as JSON with this schema:
{
  "explanation": "A clear, intuitive 2-3 paragraph explanation avoiding unnecessary jargon, using an intuitive analogy and technical precision",
  "keyTakeaways": ["3 concise high-yield bullet points for midterm exam revision"],
  "practicePrompt": "1 thought-provoking active recall question testing conceptual understanding"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              practicePrompt: { type: Type.STRING },
            },
            required: ['explanation', 'keyTakeaways', 'practicePrompt'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        topic,
        courseCode,
        ...parsed,
      });
    } catch (err: any) {
      console.error('Error in explain-topic:', err);
      res.status(500).json({
        error: 'Failed to generate explanation',
        message: err.message,
      });
    }
  });

  // 2. AI Flashcard Generator ("Turn this material or topic into 3-5 flashcards")
  app.post('/api/ai/generate-flashcards', async (req, res) => {
    try {
      const { courseCode, topic, materialTitle, notesText } = req.body;

      if (!topic && !materialTitle) {
        return res.status(400).json({ error: 'Topic or materialTitle is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          deckTitle: `${courseCode || 'Course'} Flashcards: ${topic || materialTitle}`,
          cards: [
            {
              front: `What is the primary objective of ${topic || materialTitle}?`,
              back: `To solve algorithmic/system problems with guaranteed efficiency bounds and correctness proofs.`,
              hint: `Focus on time complexity and invariants.`,
            },
            {
              front: `What are the critical trade-offs associated with ${topic || materialTitle}?`,
              back: `Space complexity overhead vs look-up/mutation speed.`,
              hint: `Consider asymptotic bounds.`,
            },
            {
              front: `How does ${topic || materialTitle} handle edge cases in practice?`,
              back: `By preserving boundary preconditions and balancing factors.`,
              hint: `Think of null pointers or overflow.`,
            },
          ],
          isFallback: true,
        });
      }

      const prompt = `Generate 4 high-yield active recall flashcards for university students studying "${courseCode || 'STEM'}": "${topic || materialTitle}".
${notesText ? `Based on these notes: ${notesText}` : ''}

Each flashcard should test a rigorous concept, definition, algorithm invariant, or theorem.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deckTitle: { type: Type.STRING },
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: 'Question or concept' },
                    back: { type: Type.STRING, description: 'Precise answer and reasoning' },
                    hint: { type: Type.STRING, description: 'Optional memory trigger' },
                  },
                  required: ['front', 'back'],
                },
              },
            },
            required: ['deckTitle', 'cards'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in generate-flashcards:', err);
      res.status(500).json({
        error: 'Failed to generate flashcards',
        message: err.message,
      });
    }
  });

  // 3. AI Assessment Quiz Generator ("Create practice quiz from these topics")
  app.post('/api/ai/generate-quiz', async (req, res) => {
    try {
      const { courseCode, topic } = req.body;

      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          title: `${courseCode} Rapid Assessment: ${topic}`,
          estimatedMinutes: 5,
          questions: [
            {
              question: `In the context of ${topic}, what is the primary invariant maintained during operations?`,
              options: [
                'Logarithmic depth bound',
                'Arbitrary sequential order',
                'Unbounded branch factor',
                'Constant space allocation',
              ],
              correctIndex: 0,
              explanation: 'Preserving a logarithmic depth bound ensures all search and mutation operations run in O(log n) time.',
            },
            {
              question: `Which scenario represents the worst-case complexity for ${topic}?`,
              options: [
                'Degenerate unbalanced input sequences',
                'Uniformly distributed randomized keys',
                'Pre-sorted inputs in optimal tree structures',
                'Empty set queries',
              ],
              correctIndex: 0,
              explanation: 'Without balancing rotations or invariants, naive implementations can degrade to linear O(n) linked lists.',
            },
            {
              question: `Why is active recall particularly effective when studying ${topic}?`,
              options: [
                'It forces memory retrieval and exposes conceptual blind spots',
                'It bypasses the need for practice problems',
                'It only tests passive recognition',
                'It guarantees 100% on multiple choice tests',
              ],
              correctIndex: 0,
              explanation: 'Active recall strengthens neural pathways and ensures you can reproduce proofs and code under timed exam pressure.',
            },
          ],
          isFallback: true,
        });
      }

      const prompt = `Create a 3-question multiple-choice practice assessment quiz for university students on "${courseCode}: ${topic}".
Include 4 plausible options, the zero-based correct index, and a clear explanation for the correct answer.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.NUMBER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['title', 'estimatedMinutes', 'questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in generate-quiz:', err);
      res.status(500).json({
        error: 'Failed to generate quiz',
        message: err.message,
      });
    }
  });

  // 4. AI Smart Study Coach Recommendation ("Help me plan what to study today")
  app.post('/api/ai/study-coach', async (req, res) => {
    try {
      const { courses, upcomingDeadlines, availableMinutes } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        const topCourse = courses?.[0]?.code || 'HEC1207';
        return res.json({
          recommendedCourse: topCourse,
          topic: `${topCourse} Priority Revision`,
          breakdown: {
            activeRecallMins: 20,
            practiceMins: 25,
          },
          coachingAdvice: 'Your midterm test is on Friday. Focusing 45 minutes on tree rotations now will save hours of cramming later.',
          actionSteps: [
            'Draw the 3 recoloring cases from memory without looking at notes',
            'Code Left-Leaning rotation pointers in scratch editor',
            'Test on 2 past paper questions',
          ],
          isFallback: true,
        });
      }

      const prompt = `You are CourseMate's intelligent academic coach.
Given the student's courses and deadlines:
Courses: ${JSON.stringify(courses || [])}
Upcoming Deadlines: ${JSON.stringify(upcomingDeadlines || [])}
Available Study Window: ${availableMinutes || 45} minutes.

Recommend the single most strategic high-yield topic to study right now, explain why, and provide a 3-step action breakdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedCourse: { type: Type.STRING },
              topic: { type: Type.STRING },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  activeRecallMins: { type: Type.NUMBER },
                  practiceMins: { type: Type.NUMBER },
                },
                required: ['activeRecallMins', 'practiceMins'],
              },
              coachingAdvice: { type: Type.STRING },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['recommendedCourse', 'topic', 'breakdown', 'coachingAdvice', 'actionSteps'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in study-coach:', err);
      res.status(500).json({
        error: 'Failed to generate study coaching',
        message: err.message,
      });
    }
  });

    // ==========================================
    // Campus Past Papers Bank: GET /api/campus/past-papers
    // ==========================================
    app.get('/api/campus/past-papers', async (req, res) => {
      try {
        const { university, courseCode, paperType, year, search } = req.query as Record<string, string>;

        if (!university) {
          return res.status(400).json({ error: 'university query param is required' });
        }

        // ----- Supabase live path -----
        if (supabaseAdmin) {
          let query = supabaseAdmin
            .from('past_papers')
            .select('*')
            .eq('university', university)
            .order('academic_year', { ascending: false })
            .order('downloads_count', { ascending: false });

          if (courseCode && courseCode !== 'all') {
            query = query.eq('course_code', courseCode.toUpperCase());
          }
          if (paperType && paperType !== 'all') {
            query = query.eq('paper_type', paperType);
          }
          if (year && year !== 'all') {
            query = query.eq('academic_year', year);
          }
          if (search) {
            query = query.or(
              `course_code.ilike.%${search}%,course_title.ilike.%${search}%`
            );
          }

          const { data, error } = await query;
          if (error) throw error;
          return res.json({ status: 'success', papers: data || [], source: 'supabase' });
        }

        // ----- Mock fallback path -----
        const MOCK_PAPERS: any[] = [
          { id: 'pp-1', university: 'ISBAT University', course_code: 'HEC1207', course_title: 'Hotel Front Office Operations', academic_year: '2023/2024', semester: 'Semester 2', paper_type: 'Final Exam', file_url: '#', file_name: 'HEC1207_FinalExam_2023-24_S2.pdf', file_size_bytes: 852000, uploader_name: 'Namukasa Grace', downloads_count: 127, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-2', university: 'ISBAT University', course_code: 'HEC1207', course_title: 'Hotel Front Office Operations', academic_year: '2022/2023', semester: 'Semester 2', paper_type: 'Midterm Test', file_url: '#', file_name: 'HEC1207_Midterm_2022-23_S2.pdf', file_size_bytes: 421000, uploader_name: 'Mugisha Robert', downloads_count: 89, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-3', university: 'ISBAT University', course_code: 'HEC1208', course_title: 'Housekeeping & Accommodation Operations', academic_year: '2023/2024', semester: 'Semester 2', paper_type: 'Final Exam', file_url: '#', file_name: 'HEC1208_FinalExam_2023-24_S2.pdf', file_size_bytes: 734000, uploader_name: 'Atim Judith', downloads_count: 94, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-4', university: 'ISBAT University', course_code: 'HEC1201', course_title: 'Food & Beverage Service', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Coursework', file_url: '#', file_name: 'HEC1201_CW_2023-24_S1.pdf', file_size_bytes: 256000, uploader_name: 'Ssali Daniel', downloads_count: 62, is_verified: false, created_at: new Date().toISOString() },
          { id: 'pp-5', university: 'ISBAT University', course_code: 'BIT2101', course_title: 'Database Management Systems', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Final Exam', file_url: '#', file_name: 'BIT2101_FinalExam_2023-24_S1.pdf', file_size_bytes: 615000, uploader_name: 'Kato Emmanuel', downloads_count: 78, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-6', university: 'ISBAT University', course_code: 'BIT2101', course_title: 'Database Management Systems', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Syllabus', file_url: '#', file_name: 'BIT2101_Syllabus_2023-24.pdf', file_size_bytes: 180000, uploader_name: 'Kato Emmanuel', downloads_count: 201, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-7', university: 'Makerere University', course_code: 'CSC2100', course_title: 'Data Structures & Algorithms', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Final Exam', file_url: '#', file_name: 'CSC2100_FinalExam_2023-24_S1.pdf', file_size_bytes: 921000, uploader_name: 'Ochieng Brian', downloads_count: 315, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-8', university: 'Makerere University', course_code: 'BIT2103', course_title: 'Systems Analysis & Design', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Midterm Test', file_url: '#', file_name: 'BIT2103_Midterm_2023-24_S1.pdf', file_size_bytes: 487000, uploader_name: 'Akello Mary', downloads_count: 182, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-9', university: 'Kyambogo University', course_code: 'BUS3201', course_title: 'Strategic Management', academic_year: '2023/2024', semester: 'Semester 2', paper_type: 'Final Exam', file_url: '#', file_name: 'BUS3201_FinalExam_2023-24_S2.pdf', file_size_bytes: 654000, uploader_name: 'Waiswa Peter', downloads_count: 143, is_verified: true, created_at: new Date().toISOString() },
          { id: 'pp-10', university: 'MUBS', course_code: 'ACC2102', course_title: 'Financial Accounting II', academic_year: '2023/2024', semester: 'Semester 1', paper_type: 'Final Exam', file_url: '#', file_name: 'ACC2102_FinalExam_2023-24_S1.pdf', file_size_bytes: 743000, uploader_name: 'Nakagave Agnes', downloads_count: 228, is_verified: true, created_at: new Date().toISOString() },
        ];

        let papers = MOCK_PAPERS.filter((p) => p.university === university);
        if (courseCode && courseCode !== 'all') papers = papers.filter((p) => p.course_code === courseCode.toUpperCase());
        if (paperType && paperType !== 'all') papers = papers.filter((p) => p.paper_type === paperType);
        if (year && year !== 'all') papers = papers.filter((p) => p.academic_year === year);
        if (search) {
          const q = search.toLowerCase();
          papers = papers.filter((p) => p.course_code.toLowerCase().includes(q) || p.course_title.toLowerCase().includes(q));
        }
        papers.sort((a, b) => b.academic_year.localeCompare(a.academic_year) || b.downloads_count - a.downloads_count);

        return res.json({ status: 'success', papers, source: 'mock' });
      } catch (err: any) {
        console.error('[API /api/campus/past-papers] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch past papers', message: err.message });
      }
    });

    // ==========================================
    // Campus Past Papers Bank: POST /api/campus/past-papers/upload
    // ==========================================
    app.post('/api/campus/past-papers/upload', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const {
          university, course_code, course_title, academic_year,
          semester, paper_type, file_url, file_name, file_size_bytes,
        } = req.body;

        if (!university || !course_code || !course_title || !paper_type || !file_url) {
          return res.status(400).json({ error: 'Missing required fields: university, course_code, course_title, paper_type, file_url' });
        }

        const record = {
          university,
          course_code: String(course_code).toUpperCase(),
          course_title,
          academic_year: academic_year || '2024/2025',
          semester: semester || 'Semester 1',
          paper_type,
          file_url,
          file_name: file_name || `${course_code}_${paper_type.replace(' ', '_')}.pdf`,
          file_size_bytes: Number(file_size_bytes) || 0,
          uploaded_by: user?.id || null,
          uploader_name: user?.email ? user.email.split('@')[0] : 'Anonymous',
          downloads_count: 0,
          is_verified: false,
        };

        if (supabaseAdmin) {
          const { data, error } = await supabaseAdmin
            .from('past_papers')
            .insert(record)
            .select()
            .single();
          if (error) throw error;
          console.log(`[API /api/campus/past-papers/upload] ✓ Paper uploaded: ${course_code} by ${record.uploader_name}`);
          return res.json({ status: 'success', paper: data });
        }

        // Mock: return the record as if saved
        const mockRecord = { ...record, id: `pp-mock-${Date.now()}`, created_at: new Date().toISOString() };
        console.log(`[API /api/campus/past-papers/upload] [MOCK] Paper metadata saved: ${course_code}`);
        return res.json({ status: 'success', paper: mockRecord, source: 'mock' });
      } catch (err: any) {
        console.error('[API /api/campus/past-papers/upload] Error:', err.message);
        res.status(500).json({ error: 'Upload failed', message: err.message });
      }
    });

    // ==========================================
    // Web Push Infrastructure
    // ==========================================

    // Lazy-load web-push (CommonJS compat)
    let webpush: any = null;
    try {
      webpush = require('web-push');
    } catch {
      console.warn('[Push] web-push not available – push endpoints will operate in mock mode.');
    }

    // VAPID key management: read from env or auto-generate for dev
    let VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || '';
    let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
    let VAPID_SUBJECT     = process.env.VAPID_SUBJECT     || 'mailto:admin@coursemate.ug';

    if (webpush && (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)) {
      const keys = webpush.generateVAPIDKeys();
      VAPID_PUBLIC_KEY  = keys.publicKey;
      VAPID_PRIVATE_KEY = keys.privateKey;
      console.log('\n[Push] ⚠️  VAPID keys not found in env – auto-generated for this session.');
      console.log('[Push] Set these in .env for persistent push delivery:');
      console.log(`  VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`);
      console.log(`  VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}\n`);
    }

    if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      console.log('[Push] ✅ web-push configured with VAPID keys.');
    }

    // In-memory subscription store (dev / non-Supabase fallback)
    const memSubscriptions = new Map<string, { subscription: any; userId: string; updatedAt: string }>();

    // Helper: get all subscriptions for a user
    async function getSubscriptionsForUser(userId: string): Promise<any[]> {
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from('push_subscriptions')
          .select('subscription_json')
          .eq('profile_id', userId);
        return (data || []).map((r: any) => JSON.parse(r.subscription_json));
      }
      return [...memSubscriptions.values()]
        .filter((s) => s.userId === userId)
        .map((s) => s.subscription);
    }

    // Helper: send one web push message
    async function sendPushNotification(subscription: any, payload: object): Promise<boolean> {
      if (!webpush || !VAPID_PUBLIC_KEY) {
        console.log('[Push] [MOCK] Would send push:', JSON.stringify(payload).slice(0, 120));
        return true;
      }
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return true;
      } catch (err: any) {
        console.warn('[Push] sendNotification error:', err.statusCode, err.message);
        // 410 / 404 → subscription expired, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          const endpoint = subscription.endpoint;
          memSubscriptions.delete(endpoint);
          if (supabaseAdmin) {
            try {
              await supabaseAdmin
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', endpoint);
            } catch {
              // ignore delete errors
            }
          }
        }
        return false;
      }
    }

    // Initialize background portal watcher cron & change detection engine
    initPortalWatcherCron({
      supabaseAdmin,
      getSubscriptionsForUser,
      sendPushNotification,
      authenticateAndFetchHtml,
      authenticateAndFetchAcmis,
    });

    // GET /api/notifications/vapid-key
    app.get('/api/notifications/vapid-key', (_req, res) => {
      if (!VAPID_PUBLIC_KEY) {
        return res.status(503).json({ error: 'Push notifications not configured on this server.' });
      }
      res.json({ publicKey: VAPID_PUBLIC_KEY });
    });

    // POST /api/notifications/subscribe
    app.post('/api/notifications/subscribe', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
          return res.status(400).json({ error: 'Missing subscription object with endpoint.' });
        }

        const userId = user?.id || 'anonymous';
        const endpoint = subscription.endpoint;

        let persistedToCloud = false;

        // If user is authenticated and Supabase is live, attempt cloud persistence
        if (supabaseAdmin && user?.id && user.id !== 'anonymous') {
          try {
            const { error } = await supabaseAdmin
              .from('push_subscriptions')
              .upsert(
                {
                  profile_id: user.id,
                  endpoint,
                  subscription_json: JSON.stringify(subscription),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'endpoint' }
              );

            if (!error) {
              persistedToCloud = true;
            } else {
              // Gracefully handle foreign key constraint if profile row isn't created yet
              console.warn(`[Push] Note: Could not attach to cloud profile (${error.message}). Retaining in session memory.`);
            }
          } catch (dbErr: any) {
            console.warn('[Push] DB warning saving subscription:', dbErr.message);
          }
        }

        // Always register in in-memory map for instantaneous delivery
        memSubscriptions.set(endpoint, {
          subscription,
          userId,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[Push] ✅ Subscription registered for ${userId} (${endpoint.slice(0, 45)}...) [${persistedToCloud ? 'Cloud DB' : 'Session Memory'}]`);
        return res.status(200).json({ status: 'success', message: 'Push subscription registered.' });
      } catch (err: any) {
        console.error('[Push /api/notifications/subscribe] Error:', err.message);
        return res.status(200).json({ status: 'success', message: 'Subscription retained locally.' });
      }
    });

    // POST /api/notifications/test
    app.post('/api/notifications/test', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const userId = user?.id || 'anonymous';

        const testPayload = {
          title: '🎓 CourseMate Alert — Test',
          body: 'Push notifications are working! You\'ll receive real-time alerts for exam changes, marks, and fee updates.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `test-${Date.now()}`,
          data: { routeHint: 'courses', category: 'test' },
        };

        const subs = await getSubscriptionsForUser(userId);

        if (subs.length === 0) {
          return res.json({
            status: 'success',
            message: 'No subscriptions found for your account — enable alerts in Settings first.',
            sent: 0,
          });
        }

        let sent = 0;
        for (const sub of subs) {
          const ok = await sendPushNotification(sub, testPayload);
          if (ok) sent++;
        }

        console.log(`[Push] Test notification sent to ${sent}/${subs.length} subscriptions for user ${userId}.`);
        res.json({ status: 'success', message: `Test notification dispatched to ${sent} device(s).`, sent });
      } catch (err: any) {
        console.error('[Push /api/notifications/test] Error:', err.message);
        res.status(500).json({ error: 'Failed to send test notification.', message: err.message });
      }
    });

    // GET /api/notifications/alerts
    app.get('/api/notifications/alerts', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const userId = user?.id || null;
        if (supabaseAdmin && userId) {
          const { data, error } = await supabaseAdmin
            .from('portal_alerts')
            .select('*')
            .eq('profile_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);
          if (!error && data && data.length > 0) {
            return res.json({ status: 'success', alerts: data });
          }
        }

        // Return rich initial demo alerts if no cloud records exist yet
        res.json({
          status: 'success',
          alerts: [
            {
              id: 'alert-mock-1',
              category: 'exam_date_change',
              severity: 'critical',
              title: '⚠️ Exam rescheduled: HEC1207',
              body: 'Hotel Front Office Operations final exam moved from 2024-11-14 → 2024-11-21 at Auditorium 1.',
              course_code: 'HEC1207',
              route_hint: 'planner',
              is_read: false,
              created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
            {
              id: 'alert-mock-2',
              category: 'attendance_drop',
              severity: 'critical',
              title: '🚨 Low attendance: HEC1208',
              body: 'Attendance dropped to 68% — below the 75% threshold. Risk of exam ban. Contact your lecturer.',
              course_code: 'HEC1208',
              route_hint: 'courses',
              is_read: false,
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'alert-mock-3',
              category: 'coursework_mark',
              severity: 'info',
              title: '📝 Mark released: BIT2101',
              body: 'Coursework mark for Database Management Systems is now 34/40.',
              course_code: 'BIT2101',
              route_hint: 'courses',
              is_read: false,
              created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'alert-mock-4',
              category: 'fee_status_change',
              severity: 'info',
              title: '✅ Fee clearance granted',
              body: 'Your fee account is now fully cleared for Semester 2, 2023/2024.',
              route_hint: 'profile',
              is_read: true,
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        });
      } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch alerts', message: err.message });
      }
    });

    // POST /api/notifications/mark-read
    app.post('/api/notifications/mark-read', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const userId = user?.id || null;
        const { alertId, all } = req.body;
        if (supabaseAdmin && userId) {
          if (all) {
            await supabaseAdmin
              .from('portal_alerts')
              .update({ is_read: true })
              .eq('profile_id', userId);
          } else if (alertId) {
            await supabaseAdmin
              .from('portal_alerts')
              .update({ is_read: true })
              .eq('id', alertId)
              .eq('profile_id', userId);
          }
        }
        res.json({ status: 'success' });
      } catch (err: any) {
        res.status(500).json({ error: 'Failed to mark alerts as read', message: err.message });
      }
    });

    // ==========================================
    // Portal Watcher: POST /api/watcher/run-now
    // Admin / test endpoint to trigger an immediate check cycle & return computed diffs
    // ==========================================
    app.post('/api/watcher/run-now', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req).catch(() => null);
        const {
          university = 'ISBAT University',
          username,
          password,
          useMock,
          forceDiff = true,
          snapshot,
        } = req.body || {};

        const profileId =
          user?.id || req.body?.profileId || (username ? `student-${username}` : 'demo-student-profile');

        const account = {
          profileId,
          university,
          username: username || 'demo.student',
          password: password || '',
          useMock: Boolean(useMock),
          lastCheckedAt: new Date().toISOString(),
        };

        const result = await runWatcherCycleForAccount(
          account,
          {
            supabaseAdmin,
            getSubscriptionsForUser,
            sendPushNotification,
            authenticateAndFetchHtml,
            authenticateAndFetchAcmis,
          },
          {
            forceDiff: Boolean(forceDiff),
            overrideSnapshot: snapshot,
            applyJitter: false, // Run immediately
          }
        );

        res.json({
          status: 'success',
          profileId: result.profileId,
          university: result.university,
          changesDetected: result.changesDetected,
          events: result.events,
          alertsDispatched: result.alertsDispatched,
        });
      } catch (err: any) {
        console.error('[Watcher /api/watcher/run-now] Error:', err.message);
        res.status(500).json({ status: 'error', message: 'Watcher run failed: ' + err.message });
      }
    });

    // ==========================================
    // Portal Watcher: GET /api/watcher/events
    // Fetch detected change events for Notification Drawer / Alert Center
    // ==========================================
    app.get('/api/watcher/events', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req).catch(() => null);
        const profileId = user?.id || (req.query?.profileId as string) || 'demo-student-profile';

        let events = await getPastChangeEvents(profileId, supabaseAdmin);

        // If no events exist yet, supply rich initial portal change events
        if (!events || events.length === 0) {
          const now = Date.now();
          events = [
            {
              id: 'event-init-1',
              type: 'EXAM',
              category: 'exam_date_change',
              severity: 'urgent',
              title: '🚨 Exam Rescheduled: BIT2201',
              message: 'Database Systems Architecture exam moved to 2026-10-21 at Main Hall Lab 2. Revision schedule updated.',
              body: 'Database Systems Architecture exam moved to 2026-10-21 at Main Hall Lab 2. Revision schedule updated.',
              deepLink: '/planner',
              routeHint: 'planner',
              courseCode: 'BIT2201',
              is_read: false,
              detectedAt: new Date(now - 25 * 60 * 1000).toISOString(),
            },
            {
              id: 'event-init-2',
              type: 'FINANCE',
              category: 'fee_status_change',
              severity: 'success',
              title: '✅ Tuition Cleared',
              message: '100% Tuition payment reconciled. Official university exam permit unlocked and ready.',
              body: '100% Tuition payment reconciled. Official university exam permit unlocked and ready.',
              deepLink: '/profile',
              routeHint: 'profile',
              is_read: false,
              detectedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'event-init-3',
              type: 'GRADE',
              category: 'coursework_mark',
              severity: 'success',
              title: '📝 Mark Released: CS1204',
              message: 'Midterm assessment mark for Data Structures & Algorithms has been published: 38/40.',
              body: 'Midterm assessment mark for Data Structures & Algorithms has been published: 38/40.',
              deepLink: '/courses',
              routeHint: 'courses',
              courseCode: 'CS1204',
              is_read: true,
              detectedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
            },
          ];
        }

        res.json({
          status: 'success',
          events,
          count: events.length,
          unreadCount: events.filter((e: any) => !e.is_read).length,
        });
      } catch (err: any) {
        console.error('[Watcher /api/watcher/events] Error:', err.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch events: ' + err.message });
      }
    });

    // ==========================================
    // Portal Watcher: POST /api/watcher/mark-read
    // ==========================================
    app.post('/api/watcher/mark-read', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req).catch(() => null);
        const profileId = user?.id || req.body?.profileId || 'demo-student-profile';
        const { eventId, all } = req.body || {};

        await markChangeEventsRead(profileId, eventId, Boolean(all), supabaseAdmin);
        res.json({ status: 'success' });
      } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
      }
    });

    // ==========================================
    // Portal Change Detection: POST /api/sync/check-updates
    // ==========================================
    app.post('/api/sync/check-updates', async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);
        const userId = user?.id || null;

        // ── 1. Load the previous snapshot from Supabase ──────────────────────
        let previousRecord: any = { courses: [], feeLedger: null };
        if (supabaseAdmin && userId) {
          const { data: academicRecord } = await supabaseAdmin
            .from('student_academic_records')
            .select('snapshot_json')
            .eq('profile_id', userId)
            .maybeSingle();

          if (academicRecord?.snapshot_json) {
            try { previousRecord = JSON.parse(academicRecord.snapshot_json); } catch {}
          }
        }

        // ── 2. Load the fresh snapshot from request body or trigger live scrape ─
        let freshRecord: any = req.body?.snapshot || previousRecord;

        // If a live portal check was requested and ACMIS credentials are available:
        if (req.body?.triggerLiveScrape && req.body?.username && req.body?.password) {
          try {
            const university = req.body.university || 'Makerere University';
            const scrapeResult = await authenticateAndFetchAcmis(
              req.body.username,
              req.body.password,
              { university }
            );
            if (scrapeResult?.courses) {
              freshRecord = {
                courses: scrapeResult.courses,
                feeLedger: scrapeResult.feeLedger || null,
                snapshotAt: new Date().toISOString(),
              };
            }
          } catch (scrapeErr: any) {
            console.warn('[PortalCheck] Live scrape failed, using stale snapshot:', scrapeErr.message);
          }
        }

        // ── 3. Run the diff engine ───────────────────────────────────────────
        const diffs = detectPortalChanges(previousRecord, freshRecord);
        console.log(`[PortalCheck] Found ${diffs.length} change(s) for user ${userId || 'anon'}.`);

        // ── 4. Persist portal_alerts to Supabase ─────────────────────────────
        if (supabaseAdmin && userId && diffs.length > 0) {
          const alertRows = diffs.map((d: any) => ({
            profile_id: userId,
            category: d.category,
            severity: d.severity,
            title: d.title,
            body: d.body,
            course_code: d.courseCode || null,
            route_hint: d.routeHint,
            meta: d.meta ? JSON.stringify(d.meta) : null,
            is_read: false,
            created_at: d.detectedAt,
          }));
          const { error: alertInsertErr } = await supabaseAdmin.from('portal_alerts').insert(alertRows);
          if (alertInsertErr) {
            console.warn('[PortalCheck] Failed to persist alerts:', alertInsertErr.message);
          }
        }

        // ── 5. Dispatch Web Push for each diff (critical/warning only) ────────
        let alertsDispatched = 0;
        if (userId && diffs.length > 0) {
          const subs = await getSubscriptionsForUser(userId);
          const highPriorityDiffs = diffs.filter((d: any) => d.severity === 'critical' || d.severity === 'warning');

          for (const diff of highPriorityDiffs) {
            const payload = formatPushPayload(diff);
            for (const sub of subs) {
              const ok = await sendPushNotification(sub, payload);
              if (ok) alertsDispatched++;
            }
          }
        }

        // ── 6. Save fresh snapshot back to Supabase ───────────────────────────
        if (supabaseAdmin && userId && freshRecord.snapshotAt) {
          const { error: snapUpdateErr } = await supabaseAdmin
            .from('student_academic_records')
            .update({ snapshot_json: JSON.stringify(freshRecord), updated_at: new Date().toISOString() })
            .eq('profile_id', userId);
          if (snapUpdateErr) {
            console.warn('[PortalCheck] Snapshot persist failed:', snapUpdateErr.message);
          }
        }

        res.json({
          status: 'success',
          changesDetected: diffs.length,
          alertsDispatched,
          diffs: diffs.map((d: any) => ({ category: d.category, severity: d.severity, title: d.title })),
        });
      } catch (err: any) {
        console.error('[PortalCheck /api/sync/check-updates] Error:', err.message);
        res.status(500).json({ error: 'Portal change check failed.', message: err.message });
      }
    });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CourseMate server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
