/**
 * CourseMate App Core Controller
 * Academic Operating System for University Students
 * Notion / Linear Aesthetic & High-Density Productivity Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
  // Load cached student data if available (Offline-First)
  let cachedStudentData = null;
  try {
    const raw = localStorage.getItem('coursemate_student_data');
    if (raw) cachedStudentData = JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading cached student data:', e);
  }

  // App State
  const state = {
    currentTab: 'home',
    theme: localStorage.getItem('coursemate_theme') || 'dark',
    isOnboarded: localStorage.getItem('coursemate_onboarded') === 'true',
    isPortalSynced: localStorage.getItem('coursemate_synced') !== 'false', // Default to true to show Samuel's live data
    selectedCohort: COURSEMATE_DATA.cohorts[0], // HEC Year 1 Semester 2
    data: cachedStudentData || COURSEMATE_DATA.syncedStudent,
    onboardingStep: 1,

    // Academic OS Assignments & Tasks System
    assignments: JSON.parse(localStorage.getItem('coursemate_assignments') || 'null') || [
      { id: 'asgn-1', code: 'HEC1207', title: 'Complete Business Plan Case Study 2', dueDate: '2026-09-29', dueTime: '23:59', priority: 'High', completed: false },
      { id: 'asgn-2', code: 'HEC12101', title: 'Logic Building Lab Worksheet 4 (Algorithms)', dueDate: '2026-09-30', dueTime: '17:00', priority: 'High', completed: false },
      { id: 'asgn-3', code: 'HEC1208', title: 'Foundational Statistics Problem Set #3', dueDate: '2026-10-02', dueTime: '23:59', priority: 'Medium', completed: false },
      { id: 'asgn-4', code: 'HEC1209', title: 'Life Skills Community Leadership Reflection', dueDate: '2026-10-05', dueTime: '23:59', priority: 'Low', completed: true },
      { id: 'asgn-5', code: 'GENERAL', title: 'ISBAT ISMIS Semester Re-Registration Form', dueDate: '2026-09-28', dueTime: '18:00', priority: 'High', completed: false }
    ],
    assignmentFilter: 'all', // 'all', 'week', 'completed'

    // Retained compatibility tasks for Campus Feed tests
    tasks: JSON.parse(localStorage.getItem('coursemate_tasks') || 'null') || [
      { id: 'task-1', title: 'Complete Semester Re-Registration on ISMIS', date: '28 Sep 2026', completed: false, category: 'Deadlines' },
      { id: 'task-2', title: 'Clear GUILD Semester 2 Activity Fee (UGX 50,000)', date: '05 Oct 2026', completed: false, category: 'Deadlines' }
    ],
    dismissedFeedIds: JSON.parse(localStorage.getItem('coursemate_dismissed_feed') || '[]'),
    feedFilter: 'All',
    gpaTargets: JSON.parse(localStorage.getItem('coursemate_gpa_targets') || '{}'),
    whatifAdjustments: {}, // courseCode -> { attended: number, missed: number }
    expandedModules: { 'HEC1207': true } // default open first module drawer
  };

  // Grade point mapping (Uganda / ISBAT University grading scale)
  const GRADE_SCALE = {
    'A': { gp: 5.0, label: 'A (5.0 GP - Outstanding)' },
    'B+': { gp: 4.5, label: 'B+ (4.5 GP - Very Good)' },
    'B': { gp: 4.0, label: 'B (4.0 GP - Good)' },
    'C+': { gp: 3.5, label: 'C+ (3.5 GP - Fair)' },
    'C': { gp: 3.0, label: 'C (3.0 GP - Pass)' },
    'D': { gp: 2.0, label: 'D (2.0 GP - Marginal Fail)' },
    'F': { gp: 0.0, label: 'F (0.0 GP - Fail)' }
  };

  // Countdown State for Milestones & Exams
  let countdownInterval = null;
  const examTargetDate = new Date();
  examTargetDate.setHours(examTargetDate.getHours() + 2);
  examTargetDate.setMinutes(examTargetDate.getMinutes() + 45);
  examTargetDate.setSeconds(examTargetDate.getSeconds() + 30);

  function updateClockUI() {
    const now = new Date();
    const diff = examTargetDate - now;

    const daysEl = document.getElementById('clockDays');
    const hoursEl = document.getElementById('clockHours');
    const minsEl = document.getElementById('clockMins');
    const secsEl = document.getElementById('clockSecs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  function startExamCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    updateClockUI();
    countdownInterval = setInterval(updateClockUI, 1000);
  }

  // DOM Elements
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabSections = document.querySelectorAll('.tab-section');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const syncStatusPill = document.getElementById('syncStatusPill');
  const onboardingOverlay = document.getElementById('onboardingOverlay');
  const portalSyncSheet = document.getElementById('portalSyncSheet');
  const gpaModalSheet = document.getElementById('gpaModalSheet');
  const closeGpaModalBtn = document.getElementById('closeGpaModalBtn');
  const assignmentModal = document.getElementById('assignmentModal');
  const closeAssignmentModalBtn = document.getElementById('closeAssignmentModalBtn');
  const studyGroupModal = document.getElementById('studyGroupModal');
  const closeStudyGroupModalBtn = document.getElementById('closeStudyGroupModalBtn');
  const sheetBackdrop = document.getElementById('sheetBackdrop');
  const toastContainer = document.getElementById('toastContainer');
  const campusPill = document.getElementById('campusPill');
  const saveGpaTargetsBtn = document.getElementById('saveGpaTargetsBtn');

  // ==========================================
  // Offline / Connectivity Monitoring
  // ==========================================
  function updateConnectivityUI(isOnline) {
    const dynamicIsland = document.getElementById('dynamicIsland');
    const pulse = document.getElementById('islandPulse');
    const statusText = document.getElementById('islandStatusText');
    if (!dynamicIsland || !pulse || !statusText) return;

    if (isOnline) {
      dynamicIsland.classList.remove('offline');
      pulse.classList.remove('offline');
      statusText.textContent = 'ISMIS Live';
    } else {
      dynamicIsland.classList.add('offline');
      pulse.classList.add('offline');
      statusText.textContent = 'Offline (Cached)';
      showToast('📡 Offline Mode: Using cached timetable & fees.');
    }
  }

  window.addEventListener('online', () => updateConnectivityUI(true));
  window.addEventListener('offline', () => updateConnectivityUI(false));
  updateConnectivityUI(navigator.onLine);

  // Initialize Theme
  applyTheme(state.theme);

  // Initialize Onboarding
  if (!state.isOnboarded) {
    showOnboarding(1);
  } else {
    onboardingOverlay.classList.add('hidden');
  }

  // Render initial tab
  renderActiveTab();
  startExamCountdown();

  // ==========================================
  // Event Listeners
  // ==========================================

  // Tab Navigation
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('coursemate_theme', state.theme);
    showToast(`Switched to ${state.theme === 'dark' ? 'Matte Slate Dark' : 'Alabaster Light'} mode`);
  });

  // Portal Sync Sheet Trigger
  if (syncStatusPill) syncStatusPill.addEventListener('click', openSyncSheet);
  if (campusPill) campusPill.addEventListener('click', () => showOnboarding(1));

  // Close Bottom Sheet on Backdrop click
  function closeAllSheets() {
    closeSyncSheet();
    closeGpaSimulator();
    closeAssignmentModal();
    closeStudyGroupModal();
  }
  if (sheetBackdrop) sheetBackdrop.addEventListener('click', closeAllSheets);

  if (closeGpaModalBtn) closeGpaModalBtn.addEventListener('click', closeGpaSimulator);
  if (closeAssignmentModalBtn) closeAssignmentModalBtn.addEventListener('click', closeAssignmentModal);
  if (closeStudyGroupModalBtn) closeStudyGroupModalBtn.addEventListener('click', closeStudyGroupModal);

  if (saveGpaTargetsBtn) {
    saveGpaTargetsBtn.addEventListener('click', () => {
      localStorage.setItem('coursemate_gpa_targets', JSON.stringify(state.gpaTargets));
      closeGpaSimulator();
      showToast('✓ Target grades saved successfully!');
    });
  }

  // Sync Form Submit
  const syncForm = document.getElementById('syncForm');
  if (syncForm) {
    syncForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePortalSync();
    });
  }

  // Assignment Form Submit
  const assignmentForm = document.getElementById('assignmentForm');
  if (assignmentForm) {
    assignmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCreateAssignment();
    });
  }

  // Pre-fill Demo Credentials
  const prefillBtn = document.getElementById('prefillDemoBtn');
  if (prefillBtn) {
    prefillBtn.addEventListener('click', () => {
      document.getElementById('syncUsername').value = 'HECS26DA';
      document.getElementById('syncPassword').value = '••••••••••••';
      showToast('Pre-filled Samuel Businge credentials');
    });
  }

  // Unlink / Toggle Sync Button
  const toggleSyncBtn = document.getElementById('toggleSyncBtn');
  if (toggleSyncBtn) {
    toggleSyncBtn.addEventListener('click', () => {
      state.isPortalSynced = !state.isPortalSynced;
      localStorage.setItem('coursemate_synced', state.isPortalSynced);
      updateSyncStatusUI();
      renderActiveTab();
      closeSyncSheet();
      showToast(state.isPortalSynced ? 'Portal connected' : 'Switched to Public Cohort view');
    });
  }

  // ==========================================
  // Tab Switching & Rendering Architecture
  // ==========================================
  function switchTab(tabId) {
    // Map backwards-compatibility alias
    let effectiveTab = tabId;
    if (tabId === 'modules') effectiveTab = 'courses';

    state.currentTab = effectiveTab;

    navTabs.forEach(t => {
      const tb = t.getAttribute('data-tab');
      t.classList.toggle('active', tb === effectiveTab || (tb === 'modules' && effectiveTab === 'courses') || (tb === 'courses' && effectiveTab === 'modules'));
    });

    tabSections.forEach(s => {
      s.classList.toggle('active', s.id === `tab-${effectiveTab}` || (effectiveTab === 'courses' && s.id === 'tab-modules'));
    });

    renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.switchTab = switchTab;

  function renderActiveTab() {
    updateHeaderUI();
    updateSyncStatusUI();

    switch (state.currentTab) {
      case 'home':
        renderHomeTab();
        break;
      case 'schedule':
        renderScheduleTab();
        break;
      case 'assignments':
        renderAssignmentsTab();
        break;
      case 'courses':
      case 'modules':
        renderCoursesTab();
        break;
      case 'financials':
        renderFinancialsTab();
        break;
      case 'feed':
        renderFeedTab();
        break;
      default:
        renderHomeTab();
    }
  }

  function updateHeaderUI() {
    const cohortDisplay = document.getElementById('headerCohort');
    if (cohortDisplay) {
      if (state.isPortalSynced) {
        const reg = (state.data.student && (state.data.student.regNumber || state.data.student.batchCode)) || 'HECS26DA';
        cohortDisplay.textContent = `Synced • ${reg}`;
      } else {
        cohortDisplay.textContent = `${state.selectedCohort.batch} • Cohort View`;
      }
    }
  }

  function updateSyncStatusUI() {
    const reg = (state.data.student && (state.data.student.regNumber || state.data.student.batchCode)) || 'HECS26DA';
    if (state.isPortalSynced) {
      syncStatusPill.className = 'sync-status-indicator synced';
      syncStatusPill.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Synced • ${reg}</span>
      `;
    } else {
      syncStatusPill.className = 'sync-status-indicator unsynced';
      syncStatusPill.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Connect Portal</span>
      `;
    }
  }

  // ==========================================
  // Helper: Attendance Calculations
  // ==========================================
  function calculateAttendanceMetrics(course) {
    const H_base = 20; // assumed lectures held to date
    const basePercent = course.attendancePercent || 75;
    const baseAttended = Math.round(H_base * (basePercent / 100));

    const adj = state.whatifAdjustments[course.code] || { attended: 0, missed: 0 };
    const A = Math.max(0, baseAttended + adj.attended);
    const H = Math.max(A, H_base + adj.attended + adj.missed);
    const currentPercent = Math.min(100, Math.max(0, Math.round((A / H) * 100)));

    let status = 'safe';
    let pillText = `Safe (${currentPercent}%)`;
    let advice = '';

    if (currentPercent >= 80) {
      status = 'safe';
      const safeMiss = Math.max(0, Math.floor((4 * A - 3 * H) / 3));
      pillText = `Safe (${currentPercent}%)`;
      advice = safeMiss > 0
        ? `Can safely miss next <strong>${safeMiss} lecture${safeMiss > 1 ? 's' : ''}</strong> while remaining &ge; 75% threshold.`
        : `At threshold margin: Attend next lecture to keep buffer.`;
    } else if (currentPercent >= 70 && currentPercent < 80) {
      status = 'at-risk';
      const need = Math.max(1, Math.ceil(3 * H - 4 * A));
      pillText = `At Risk (${currentPercent}% - Need ${need} classes)`;
      advice = `⚠️ Must attend next <strong>${need} consecutive lecture${need > 1 ? 's' : ''}</strong> to regain &ge; 75% clearance.`;
    } else {
      status = 'critical';
      const need = Math.max(1, Math.ceil(3 * H - 4 * A));
      pillText = `Critical (<65%)`;
      advice = `🚨 Critical attendance! Must attend next <strong>${need} consecutive lectures</strong> to avoid exam hall disbarment.`;
    }

    return {
      currentPercent,
      status,
      pillText,
      advice,
      isSimulated: adj.attended !== 0 || adj.missed !== 0,
      attended: A,
      total: H
    };
  }

  // ==========================================
  // Render: Home Tab ("Command Center")
  // ==========================================
  function renderHomeTab() {
    const container = document.getElementById('tab-home');
    if (!container) return;

    const nextExam = state.data.courses[0]; // HEC1207

    // Academic Health Metrics
    const completedAssignments = state.assignments.filter(a => a.completed).length;
    const activeAssignments = state.assignments.filter(a => !a.completed).length;
    const overdueAssignments = state.assignments.filter(a => !a.completed && new Date(a.dueDate) < new Date('2026-09-28')).length;

    // Attendance Health
    let totalAttended = 0;
    let totalClasses = 0;
    let safeModuleCount = 0;
    state.data.courses.forEach(c => {
      const m = calculateAttendanceMetrics(c);
      totalAttended += m.attended;
      totalClasses += m.total;
      if (m.status === 'safe') safeModuleCount++;
    });
    const avgAttendance = Math.round((totalAttended / totalClasses) * 100);

    // Urgent Attention Items (Due within 48h or high priority active)
    const urgentItems = state.assignments.filter(a => !a.completed);

    container.innerHTML = `
      <!-- Dynamic Hero Banner: Contextual "Up Next" Class Card -->
      <section class="command-hero-card" data-purpose="up-next-banner">
        <div class="command-hero-badge-row">
          <span class="live-dot-pill"><span class="pulse-dot"></span> Next Lecture Up Next</span>
          <span class="room-pill">📍 Computer Lab 4 • Tech Wing</span>
        </div>
        <div class="command-hero-title">🔔 Next lecture in 30 mins: Logic Building &amp; Elementary Programming</div>
        <div class="command-hero-meta">
          <span>Module: <strong>HEC12101</strong></span>
          <span>•</span>
          <span>Lecturer: <strong>Eng. R. Katende</strong></span>
          <span>•</span>
          <span>Time: <strong>02:30 PM - 04:30 PM</strong></span>
        </div>

        <!-- Integrated Upcoming Milestone Countdown Card (Preserving .exam-subject-title & countdown) -->
        <div class="hero-exam-countdown" style="margin-top: 14px; border-color: var(--glass-border-subtle);">
          <div class="countdown-top-row">
            <div class="countdown-label">Next Final Examination</div>
            <span class="badge-pill warning">Room: ${nextExam.timetable.venue}</span>
          </div>
          <div class="exam-subject-title">${nextExam.code} - ${nextExam.title}</div>
          <div class="exam-venue-time">
            <span>📅 ${nextExam.timetable.examDate}</span>
            <span>⏰ ${nextExam.timetable.examTime}</span>
          </div>
          <div class="countdown-clock-grid">
            <div class="clock-cell">
              <div class="clock-num" id="clockDays">00</div>
              <div class="clock-label">Days</div>
            </div>
            <div class="clock-cell">
              <div class="clock-num" id="clockHours">00</div>
              <div class="clock-label">Hours</div>
            </div>
            <div class="clock-cell">
              <div class="clock-num" id="clockMins">00</div>
              <div class="clock-label">Mins</div>
            </div>
            <div class="clock-cell">
              <div class="clock-num" id="clockSecs">00</div>
              <div class="clock-label">Secs</div>
            </div>
          </div>
        </div>

        <!-- 1-Tap Calendar Export (.ics) on Home -->
        <div class="calendar-sync-banner" style="margin-top: 12px;">
          <div class="calendar-sync-info">
            <div class="calendar-sync-icon">📅</div>
            <div>
              <div class="calendar-sync-title">Sync Timetable to Calendar</div>
              <div class="calendar-sync-sub">Export lectures &amp; scheduled exams to Apple / Google Calendar</div>
            </div>
          </div>
          <button class="btn-calendar-export" id="exportCalendarBtn" onclick="window.exportCalendarIcs()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Export .ics</span>
          </button>
        </div>
      </section>

      <!-- Academic Health Overview Widget -->
      <section class="section-container" style="margin-top: 18px;">
        <div class="section-header-flex">
          <div class="section-title">📊 Academic Health Overview</div>
          <span class="badge-pill success">Semester 2 Clear</span>
        </div>

        <div class="academic-health-grid">
          <!-- Card 1: Assignments Health -->
          <div class="health-card" onclick="window.switchTab('assignments')">
            <div class="health-card-header">
              <span class="health-icon">📝</span>
              <span class="health-tag">Tasks</span>
            </div>
            <div class="health-metric-main">${activeAssignments} Active</div>
            <div class="health-metric-sub">
              <span>${completedAssignments} Done</span> • <span style="color:${overdueAssignments > 0 ? 'var(--accent-danger)' : 'var(--text-muted)'};">${overdueAssignments} Overdue</span>
            </div>
            <div class="health-progress-bar">
              <div class="health-progress-fill" style="width: ${Math.round((completedAssignments / (state.assignments.length || 1)) * 100)}%;"></div>
            </div>
          </div>

          <!-- Card 2: Attendance Health -->
          <div class="health-card" onclick="window.switchTab('courses')">
            <div class="health-card-header">
              <span class="health-icon">🛡️</span>
              <span class="health-tag">${avgAttendance}% Avg</span>
            </div>
            <div class="health-metric-main">${totalAttended}/${totalClasses} Classes</div>
            <div class="health-metric-sub">
              <span style="color:var(--accent-primary); font-weight:700;">${safeModuleCount}/6 Units Safe</span> (&ge;75%)
            </div>
            <div class="health-progress-bar">
              <div class="health-progress-fill" style="width: ${avgAttendance}%; background: var(--accent-primary);"></div>
            </div>
          </div>

          <!-- Card 3: Upcoming Milestones -->
          <div class="health-card" onclick="window.switchTab('schedule')">
            <div class="health-card-header">
              <span class="health-icon">🎯</span>
              <span class="health-tag">October</span>
            </div>
            <div class="health-metric-main">5 Milestones</div>
            <div class="health-metric-sub">
              <span>2 Exams</span> • <span>3 CBT Tests</span>
            </div>
            <div class="health-progress-bar">
              <div class="health-progress-fill" style="width: 70%; background: var(--accent-warning);"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick-Access Action Grid -->
      <section class="section-container" style="margin-top: 18px;">
        <div class="section-header-flex">
          <div class="section-title">⚡ Quick-Access Navigation</div>
        </div>

        <div class="quick-access-grid">
          <div class="quick-action-tile" onclick="window.switchTab('feed')">
            <div class="tile-icon">📢</div>
            <div class="tile-title">Announce</div>
            <div class="tile-sub">Notices &amp; Feed</div>
          </div>

          <div class="quick-action-tile" onclick="window.switchTab('assignments')">
            <div class="tile-icon">📝</div>
            <div class="tile-title">Assignments</div>
            <div class="tile-sub">Tests &amp; CW</div>
          </div>

          <div class="quick-action-tile" onclick="window.switchTab('courses')">
            <div class="tile-icon">📄</div>
            <div class="tile-title">Materials</div>
            <div class="tile-sub">Slides &amp; Papers</div>
          </div>

          <div class="quick-action-tile" onclick="window.switchTab('assignments')">
            <div class="tile-icon">🧪</div>
            <div class="tile-title">Tests</div>
            <div class="tile-sub">CBT Prep</div>
          </div>

          <div class="quick-action-tile" onclick="window.switchTab('schedule')">
            <div class="tile-icon">📅</div>
            <div class="tile-title">Schedule</div>
            <div class="tile-sub">Live Timetable</div>
          </div>

          <div class="quick-action-tile" onclick="window.openStudyGroupModal('HEC1207')">
            <div class="tile-icon">👥</div>
            <div class="tile-title">Study Groups</div>
            <div class="tile-sub">28 Classmates</div>
          </div>
        </div>
      </section>

      <!-- Urgent Attention Feed: Due within 48 Hours with 1-Tap Toggle -->
      <section class="section-container" style="margin-top: 18px;">
        <div class="section-header-flex">
          <div class="section-title">🚨 Urgent Attention Feed</div>
          <button class="btn-mark-done" onclick="window.openAssignmentModal()">+ Add Task</button>
        </div>

        <div class="urgent-feed-list">
          ${urgentItems.length === 0 ? `
            <div class="empty-state-card">
              <span>🎉 All urgent deadlines cleared! Great job staying ahead.</span>
            </div>
          ` : urgentItems.map(item => `
            <div class="urgent-card ${item.priority === 'High' ? 'urgent-high' : ''}" id="urgent-item-${item.id}">
              <div class="urgent-card-left">
                <input type="checkbox" class="urgent-checkbox" ${item.completed ? 'checked' : ''} onchange="window.toggleAssignment('${item.id}')" />
                <div>
                  <div class="urgent-title-row">
                    <span class="badge-code">${item.code}</span>
                    <span class="urgent-task-title">${item.title}</span>
                  </div>
                  <div class="urgent-due-row">
                    <span>Due: <strong>${item.dueDate} at ${item.dueTime}</strong></span>
                    <span class="badge-priority ${item.priority.toLowerCase()}">${item.priority}</span>
                  </div>
                </div>
              </div>
              <button type="button" class="btn-mark-done" onclick="window.toggleAssignment('${item.id}')">
                Mark as Done
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    updateClockUI();
  }

  // ==========================================
  // Render: Schedule Tab
  // ==========================================
  function renderScheduleTab() {
    const container = document.getElementById('tab-schedule');
    if (!container) return;

    const nextExam = state.data.courses[0]; // HEC1207

    container.innerHTML = `
      <!-- Live Exam Countdown Hero -->
      <div class="hero-exam-countdown">
        <div class="countdown-top-row">
          <div class="countdown-label">Next Final Examination</div>
          <span class="badge-pill warning">Room: ${nextExam.timetable.venue}</span>
        </div>
        <div class="exam-subject-title">${nextExam.code} - ${nextExam.title}</div>
        <div class="exam-venue-time">
          <span>📅 ${nextExam.timetable.examDate}</span>
          <span>⏰ ${nextExam.timetable.examTime}</span>
        </div>
        <div class="countdown-clock-grid">
          <div class="clock-cell">
            <div class="clock-num" id="clockDays">00</div>
            <div class="clock-label">Days</div>
          </div>
          <div class="clock-cell">
            <div class="clock-num" id="clockHours">00</div>
            <div class="clock-label">Hours</div>
          </div>
          <div class="clock-cell">
            <div class="clock-num" id="clockMins">00</div>
            <div class="clock-label">Mins</div>
          </div>
          <div class="clock-cell">
            <div class="clock-num" id="clockSecs">00</div>
            <div class="clock-label">Secs</div>
          </div>
        </div>
      </div>

      <!-- 1-Tap Calendar Sync (.ics Export) Banner -->
      <div class="calendar-sync-banner">
        <div class="calendar-sync-info">
          <div class="calendar-sync-icon">📅</div>
          <div>
            <div class="calendar-sync-title">Sync Timetable to Calendar</div>
            <div class="calendar-sync-sub">Export lectures &amp; scheduled exams to Apple / Google Calendar</div>
          </div>
        </div>
        <button class="btn-calendar-export" id="exportCalendarBtn" onclick="window.exportCalendarIcs()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Export .ics</span>
        </button>
      </div>

      <!-- Today's Lecture Timeline -->
      <div class="timeline-section-title">
        <span>Today's Lecture Timeline</span>
        <span style="font-size:11px; font-family:var(--font-mono); color:var(--accent-primary);">Mon, Sep 28</span>
      </div>

      <div class="lecture-timeline-list">
        ${COURSEMATE_DATA.publicSchedule.lectures.map(lec => `
          <div class="lecture-card ${lec.status === 'Happening Now' ? 'now' : ''}">
            <div class="lecture-time-col">
              <span class="time-start">${lec.time.split(' - ')[0]}</span>
              <span class="time-end">${lec.time.split(' - ')[1]}</span>
            </div>
            <div class="lecture-info-col">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="lecture-code-badge">${lec.code}</span>
                <span class="badge-pill ${lec.status === 'Happening Now' ? 'success' : lec.status === 'Completed' ? 'neutral' : 'warning'}">${lec.status}</span>
              </div>
              <div class="lecture-title">${lec.title}</div>
              <div class="lecture-meta-row">
                <div class="lecture-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${lec.room}</span>
                </div>
                <div class="lecture-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>${lec.lecturer}</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    updateClockUI();
  }

  // 1-Tap Calendar Export Function (.ics RFC 5545)
  window.exportCalendarIcs = function() {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CourseMate//ISBAT University Campus Companion//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CourseMate ISBAT Timetable'
    ];

    // Add today's and weekly lectures
    COURSEMATE_DATA.publicSchedule.lectures.forEach(lec => {
      ics.push('BEGIN:VEVENT');
      ics.push(`UID:coursemate-lec-${lec.id}@isbatuniversity.ac.ug`);
      ics.push('DTSTAMP:20260928T080000Z');
      ics.push('DTSTART:20260928T083000Z');
      ics.push('DTEND:20260928T103000Z');
      ics.push(`SUMMARY:[ISBAT] ${lec.code} - ${lec.title}`);
      ics.push(`LOCATION:${lec.room}`);
      ics.push(`DESCRIPTION:Lecturer: ${lec.lecturer} | Course: ${lec.title} | Status: ${lec.status}`);
      ics.push('RRULE:FREQ=WEEKLY');
      ics.push('END:VEVENT');
    });

    // Add scheduled exams
    state.data.courses.forEach(c => {
      if (c.timetable && c.timetable.examDate && c.timetable.examDate !== 'Not Yet Scheduled') {
        ics.push('BEGIN:VEVENT');
        ics.push(`UID:coursemate-exam-${c.code}@isbatuniversity.ac.ug`);
        ics.push('DTSTAMP:20260928T080000Z');
        ics.push('DTSTART:20260928T143000Z');
        ics.push('DTEND:20260928T173000Z');
        ics.push(`SUMMARY:[FINAL EXAM] ${c.code} - ${c.title}`);
        ics.push(`LOCATION:${c.timetable.venue}`);
        ics.push(`DESCRIPTION:ISBAT University End of Semester Final Examination for ${c.code} (${c.creditUnits} Credits)`);
        ics.push('END:VEVENT');
      }
    });

    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CourseMate-ISBAT-Schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('✓ Calendar synced! Downloaded CourseMate-ISBAT-Schedule.ics');
  };

  // ==========================================
  // Render: Assignments Tab (Interactive Deadlines Tracker)
  // ==========================================
  function renderAssignmentsTab() {
    const container = document.getElementById('tab-assignments');
    if (!container) return;

    const totalCount = state.assignments.length;
    const completedCount = state.assignments.filter(a => a.completed).length;
    const weekCount = state.assignments.filter(a => {
      // Due within next 7 days from Sep 28
      const d = new Date(a.dueDate);
      const diffDays = (d - new Date('2026-09-28')) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    // Filter assignments
    let displayedAssignments = state.assignments;
    if (state.assignmentFilter === 'completed') {
      displayedAssignments = state.assignments.filter(a => a.completed);
    } else if (state.assignmentFilter === 'week') {
      displayedAssignments = state.assignments.filter(a => {
        const d = new Date(a.dueDate);
        const diffDays = (d - new Date('2026-09-28')) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      });
    }

    container.innerHTML = `
      <!-- Top Action Bar -->
      <div class="assignments-header-row">
        <div>
          <div class="assignments-main-title">📝 Academic Deadlines &amp; Tasks</div>
          <div class="assignments-sub-title">Coursework, Lab CBTs &amp; Submission Tracker</div>
        </div>
        <button class="btn-primary" id="openNewAssignmentBtn" onclick="window.openAssignmentModal()">
          <span>+ New Task</span>
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="feed-filter-bar" style="margin: 12px 0 16px 0;">
        <button type="button" class="feed-filter-pill ${state.assignmentFilter === 'all' ? 'active' : ''}" onclick="window.setAssignmentFilter('all')">
          All Tasks (${totalCount})
        </button>
        <button type="button" class="feed-filter-pill ${state.assignmentFilter === 'week' ? 'active' : ''}" onclick="window.setAssignmentFilter('week')">
          Due This Week (${weekCount})
        </button>
        <button type="button" class="feed-filter-pill ${state.assignmentFilter === 'completed' ? 'active' : ''}" onclick="window.setAssignmentFilter('completed')">
          Completed (${completedCount})
        </button>
      </div>

      <!-- Assignments List -->
      <div class="tasks-list" id="assignmentsListContainer">
        ${displayedAssignments.length === 0 ? `
          <div class="empty-state-card">
            <span>No tasks match the selected filter. Click <strong>+ New Task</strong> to add one!</span>
          </div>
        ` : displayedAssignments.map(task => `
          <div class="assignment-item-row ${task.completed ? 'completed' : ''}" id="asgn-row-${task.id}">
            <input type="checkbox" class="assignment-checkbox" ${task.completed ? 'checked' : ''} onchange="window.toggleAssignment('${task.id}')" />
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span class="badge-code">${task.code}</span>
                <span class="task-text">${task.title}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <span class="task-badge-date">Due: ${task.dueDate} at ${task.dueTime}</span>
                <span class="badge-priority ${task.priority.toLowerCase()}">${task.priority}</span>
              </div>
            </div>
            <button type="button" class="task-delete-btn" onclick="window.deleteAssignment('${task.id}')" title="Delete Task">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  window.setAssignmentFilter = function(f) {
    state.assignmentFilter = f;
    renderAssignmentsTab();
  };

  window.toggleAssignment = function(id) {
    const task = state.assignments.find(a => a.id === id);
    if (task) {
      task.completed = !task.completed;
      localStorage.setItem('coursemate_assignments', JSON.stringify(state.assignments));

      // Also sync backwards compatibility tasks
      const legacy = state.tasks.find(t => t.id === id);
      if (legacy) legacy.completed = task.completed;
      localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));

      renderActiveTab();
      showToast(task.completed ? '✓ Task marked completed!' : 'Task reopened');
    }
  };

  window.deleteAssignment = function(id) {
    state.assignments = state.assignments.filter(a => a.id !== id);
    localStorage.setItem('coursemate_assignments', JSON.stringify(state.assignments));
    renderActiveTab();
    showToast('Assignment deleted');
  };

  function openAssignmentModal() {
    if (assignmentModal) assignmentModal.classList.add('open');
    if (sheetBackdrop) sheetBackdrop.classList.add('open');
    const dateInput = document.getElementById('taskDueDateInput');
    if (dateInput && !dateInput.value) dateInput.value = '2026-10-02';
  }
  window.openAssignmentModal = openAssignmentModal;

  function closeAssignmentModal() {
    if (assignmentModal) assignmentModal.classList.remove('open');
    if (sheetBackdrop) sheetBackdrop.classList.remove('open');
  }
  window.closeAssignmentModal = closeAssignmentModal;

  function handleCreateAssignment() {
    const courseCode = document.getElementById('taskCourseUnit').value;
    const title = document.getElementById('taskTitleInput').value.trim();
    const dueDate = document.getElementById('taskDueDateInput').value;
    const dueTime = document.getElementById('taskDueTimeInput').value || '23:59';
    const priority = document.getElementById('taskPrioritySelect').value;

    if (!title) {
      showToast('Please enter an assignment title');
      return;
    }

    const newTask = {
      id: 'asgn-' + Date.now(),
      code: courseCode,
      title,
      dueDate,
      dueTime,
      priority,
      completed: false
    };

    state.assignments.unshift(newTask);
    localStorage.setItem('coursemate_assignments', JSON.stringify(state.assignments));

    // Also push to legacy tasks for feed test compatibility
    state.tasks.unshift({
      id: newTask.id,
      title: `${courseCode}: ${title}`,
      date: dueDate,
      completed: false,
      category: 'Deadlines'
    });
    localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));

    document.getElementById('assignmentForm').reset();
    closeAssignmentModal();
    renderActiveTab();
    showToast(`✓ Added task: ${title}`);
  }

  // ==========================================
  // Render: Courses Hub & Materials Tab
  // ==========================================
  function renderCoursesTab() {
    const container = document.getElementById('tab-courses') || document.getElementById('tab-modules');
    const legacyContainer = document.getElementById('tab-modules');
    if (!container) return;

    const courses = state.data.courses;
    const totalCredits = courses.reduce((acc, c) => acc + c.creditUnits, 0);

    // Compute Overall Attendance Radar Stats
    let safeCount = 0;
    let atRiskCount = 0;
    let criticalCount = 0;

    courses.forEach(c => {
      const m = calculateAttendanceMetrics(c);
      if (m.status === 'safe') safeCount++;
      else if (m.status === 'at-risk') atRiskCount++;
      else criticalCount++;
    });

    const markup = `
      <!-- Stats Overview Header -->
      <div class="module-stats-header">
        <div class="stat-box">
          <div class="stat-value">${courses.length}</div>
          <div class="stat-title">Units</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${totalCredits.toFixed(1)}</div>
          <div class="stat-title">Total Credits</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" style="color: ${criticalCount > 0 ? 'var(--accent-danger)' : atRiskCount > 0 ? 'var(--accent-warning)' : 'var(--accent-primary)'};">
            ${safeCount}/${courses.length}
          </div>
          <div class="stat-title">Safe Attendance</div>
        </div>
      </div>

      <!-- Attendance Safety Radar Banner -->
      <div class="attendance-radar-banner">
        <div class="radar-header-flex">
          <div class="radar-title-wrap">
            <div class="radar-icon-beacon">📡</div>
            <div class="radar-title">Attendance Safety Radar</div>
          </div>
          <span class="radar-badge-req">75% Exam Threshold</span>
        </div>

        <div class="radar-stats-grid">
          <div class="radar-stat-card safe">
            <div class="radar-stat-num safe">${safeCount}</div>
            <div class="radar-stat-label">Safe (80%+)</div>
          </div>
          <div class="radar-stat-card at-risk">
            <div class="radar-stat-num at-risk">${atRiskCount}</div>
            <div class="radar-stat-label">At Risk</div>
          </div>
          <div class="radar-stat-card critical">
            <div class="radar-stat-num critical">${criticalCount}</div>
            <div class="radar-stat-label">Critical (<70%)</div>
          </div>
        </div>
      </div>

      <!-- Interactive GPA Simulator Trigger Button -->
      <div style="margin-bottom: 18px;">
        <button class="btn-primary" id="openGpaSimulatorBtn" onclick="window.openGpaSimulator()" style="width:100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <span>GPA &amp; Target Grade Simulator</span>
        </button>
      </div>

      <div class="timeline-section-title">
        <span>Enrolled Course Units (Year 1 Sem 2)</span>
        <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-secondary);">${state.data.student.batchCode}</span>
      </div>

      <!-- Enrolled Modules Cards with Expandable Drawer & Materials Vault -->
      ${courses.map(course => {
        const radar = calculateAttendanceMetrics(course);
        const isExpanded = !!state.expandedModules[course.code];
        const needLectures = Math.max(0, Math.ceil(3 * radar.total - 4 * radar.attended));

        return `
          <div class="module-card">
            <div class="module-top-row">
              <span class="module-code">${course.code}</span>
              <span class="module-credits">${course.creditUnits} Credit Units</span>
            </div>
            <div class="module-name">${course.title}</div>

            <!-- Attendance Safety Radar Meter for this Unit -->
            <div class="attendance-meter-container">
              <div class="meter-top-flex">
                <span style="font-size:11px; font-weight:700; color:var(--text-secondary);">Attendance Radar</span>
                <span class="safety-status-pill ${radar.status}">
                  ${radar.status === 'safe' ? '✓' : radar.status === 'at-risk' ? '⚠️' : '🚨'}
                  ${radar.pillText}
                </span>
              </div>

              <!-- Visual Progress Track with 75% Threshold Line -->
              <div class="attendance-progress-track">
                <div class="attendance-progress-bar ${radar.status}" style="width: ${radar.currentPercent}%;"></div>
                <div class="attendance-threshold-line" title="75% Exam Clearance Requirement"></div>
              </div>
              <div class="threshold-label">75% Exam Threshold Line</div>

              <!-- Predictive What-if Simulator Row -->
              <div class="whatif-row">
                <div class="whatif-advice">${radar.advice}</div>
                <div style="display:flex; gap: 4px;">
                  <button type="button" class="whatif-btn" title="Simulate attending next class" onclick="window.adjustAttendance('${course.code}', 1, 0)">+1 Attend</button>
                  <button type="button" class="whatif-btn" title="Simulate missing next class" onclick="window.adjustAttendance('${course.code}', 0, 1)">+1 Miss</button>
                  ${radar.isSimulated ? `
                    <button type="button" class="whatif-btn" style="color:var(--accent-warning);" onclick="window.resetAttendance('${course.code}')">Reset</button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Metric Quick Info Row -->
            <div class="module-metrics-grid" style="margin-top: 10px;">
              <div class="metric-item">
                <span class="metric-label">CW Submission</span>
                <span class="metric-val" style="color:${course.assessments.coursework === 'Closed' ? 'var(--accent-primary)' : 'var(--accent-warning)'};">${course.assessments.coursework === 'Closed' ? '✓ Completed' : 'Pending'}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CW Score</span>
                <span class="metric-val">${course.assessments.cwScore}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">CBT Score</span>
                <span class="metric-val">${course.assessments.cbtScore}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Exam Date</span>
                <span class="metric-val">${course.timetable.examDate}</span>
              </div>
            </div>

            <!-- Expandable Drawer Toggle -->
            <button type="button" class="drawer-toggle-btn" onclick="window.toggleModuleDrawer('${course.code}')">
              <span>${isExpanded ? 'Hide Course Hub &amp; Materials' : 'Explore Materials, Attendance Calculator &amp; Study Group'}</span>
              <span>${isExpanded ? '▲' : '▼'}</span>
            </button>

            <!-- Expandable Drawer Content -->
            <div class="module-drawer ${isExpanded ? 'open' : ''}">
              <!-- Attendance Calculator -->
              <div class="drawer-section">
                <div class="drawer-section-title">🧮 Predictive Attendance Calculator</div>
                <div class="calculator-box">
                  <div class="calc-formula">
                    Current: <strong>${radar.currentPercent}%</strong> • Attend <strong>${needLectures}</strong> more lectures to hit safe exam threshold (75%).
                  </div>
                  <div class="calc-sub">
                    Minimum requirement: 75% under ISBAT Academic Regulations 2026.
                  </div>
                </div>
              </div>

              <!-- Materials Vault Placeholder -->
              <div class="drawer-section">
                <div class="drawer-section-title">📁 Materials Vault</div>
                <div class="materials-vault-grid">
                  <div class="material-chip" onclick="window.downloadMaterial('${course.code}', 'Lecture 1 - Slides & Notes')">
                    <span class="material-chip-icon">📄</span>
                    <div class="material-chip-info">
                      <div class="material-title">Lecture 1: Intro &amp; Core Syllabus</div>
                      <div class="material-meta">PDF • 4.2 MB • Download</div>
                    </div>
                  </div>
                  <div class="material-chip" onclick="window.downloadMaterial('${course.code}', 'Lecture 2 - Lab Workbook')">
                    <span class="material-chip-icon">🧪</span>
                    <div class="material-chip-info">
                      <div class="material-title">Lecture 2: Practical Lab Manual</div>
                      <div class="material-meta">ZIP • 8.1 MB • Download</div>
                    </div>
                  </div>
                  <div class="material-chip" onclick="window.downloadMaterial('${course.code}', 'Past Papers - 2024 & 2025')">
                    <span class="material-chip-icon">📚</span>
                    <div class="material-chip-info">
                      <div class="material-title">Past Exam Papers (2024 - 2025)</div>
                      <div class="material-meta">PDF • 3.5 MB • Solved</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Study Group Action Button -->
              <div class="drawer-section" style="margin-top: 12px;">
                <button type="button" class="btn-study-group" onclick="window.openStudyGroupModal('${course.code}')">
                  <span class="study-icon">👥</span>
                  <span>Join ${course.code} Study Group (28 classmates)</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;

    container.innerHTML = markup;
    if (legacyContainer && legacyContainer !== container) {
      legacyContainer.innerHTML = markup;
    }
  }

  window.toggleModuleDrawer = function(courseCode) {
    state.expandedModules[courseCode] = !state.expandedModules[courseCode];
    renderCoursesTab();
  };

  window.downloadMaterial = function(courseCode, name) {
    showToast(`✓ Downloading ${courseCode}: ${name}`);
  };

  // Study Group Modal Logic
  function openStudyGroupModal(courseCode) {
    const titleEl = document.getElementById('studyGroupModalTitle');
    const subtitleEl = document.getElementById('studyGroupModalSubtitle');
    const bodyEl = document.getElementById('studyGroupModalBody');

    if (titleEl) titleEl.textContent = `👥 Study Group: ${courseCode}`;
    if (subtitleEl) subtitleEl.textContent = `28 Enrolled Classmates • Class Revision & Resource Exchange`;

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="study-roster-list">
          <div class="roster-item you">
            <div class="roster-avatar">SB</div>
            <div class="roster-info">
              <div class="roster-name">Samuel Businge (You)</div>
              <div class="roster-role">HECS26DA • Active Now</div>
            </div>
            <span class="badge-pill success">Member</span>
          </div>
          <div class="roster-item">
            <div class="roster-avatar" style="background:#6366f1;">SN</div>
            <div class="roster-info">
              <div class="roster-name">Sarah Nabirye</div>
              <div class="roster-role">Study Lead • Active 4 mins ago</div>
            </div>
            <button class="btn-mark-done" onclick="window.showToast('Connecting with Sarah...')">Message</button>
          </div>
          <div class="roster-item">
            <div class="roster-avatar" style="background:#f59e0b;">BK</div>
            <div class="roster-info">
              <div class="roster-name">Brian Kato</div>
              <div class="roster-role">Shared Lab Worksheet 3 notes</div>
            </div>
            <button class="btn-mark-done" onclick="window.showToast('Connecting with Brian...')">Message</button>
          </div>
          <div class="roster-item">
            <div class="roster-avatar" style="background:#10b981;">FA</div>
            <div class="roster-info">
              <div class="roster-name">Fiona Atuhaire</div>
              <div class="roster-role">Active 18 mins ago</div>
            </div>
            <button class="btn-mark-done" onclick="window.showToast('Connecting with Fiona...')">Message</button>
          </div>
        </div>

        <div class="study-recent-chatter">
          <div style="font-weight:700; font-size:12px; color:var(--text-secondary); margin-bottom:6px;">💬 Recent Group Discussion</div>
          <div class="chatter-bubble">
            <strong>Brian Kato:</strong> Has anyone tested the binary tree traversal on Lab 4? Dr. Mugisha mentioned it will appear on CBT.
          </div>
          <div class="chatter-bubble">
            <strong>Sarah Nabirye:</strong> Yes! Uploaded the annotated diagram into the Materials Vault section.
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-top:16px;">
          <button class="btn-primary" onclick="window.joinStudyGroupChannel('${courseCode}')">
            <span>🚀 Join WhatsApp / Telegram Peer Group</span>
          </button>
          <button class="btn-secondary" onclick="window.closeStudyGroupModal()">
            <span>Done</span>
          </button>
        </div>
      `;
    }

    if (studyGroupModal) studyGroupModal.classList.add('open');
    if (sheetBackdrop) sheetBackdrop.classList.add('open');
  }
  window.openStudyGroupModal = openStudyGroupModal;

  function closeStudyGroupModal() {
    if (studyGroupModal) studyGroupModal.classList.remove('open');
    if (sheetBackdrop) sheetBackdrop.classList.remove('open');
  }
  window.closeStudyGroupModal = closeStudyGroupModal;

  window.joinStudyGroupChannel = function(courseCode) {
    showToast(`✓ Joined ${courseCode} Study Group! Link copied to clipboard.`);
    closeStudyGroupModal();
  };

  // Attendance What-if Simulator Actions
  window.adjustAttendance = function(courseCode, deltaAttended, deltaMissed) {
    if (!state.whatifAdjustments[courseCode]) {
      state.whatifAdjustments[courseCode] = { attended: 0, missed: 0 };
    }
    state.whatifAdjustments[courseCode].attended += deltaAttended;
    state.whatifAdjustments[courseCode].missed += deltaMissed;
    renderCoursesTab();
  };

  window.resetAttendance = function(courseCode) {
    if (state.whatifAdjustments[courseCode]) {
      delete state.whatifAdjustments[courseCode];
      renderCoursesTab();
    }
  };

  // ==========================================
  // GPA / Target Grade Simulator Logic
  // ==========================================
  function openGpaSimulator() {
    if (gpaModalSheet) gpaModalSheet.classList.add('open');
    if (sheetBackdrop) sheetBackdrop.classList.add('open');
    renderGpaCoursesList();
    recalculateGpa();
  }
  window.openGpaSimulator = openGpaSimulator;

  function closeGpaSimulator() {
    if (gpaModalSheet) gpaModalSheet.classList.remove('open');
    if (sheetBackdrop) sheetBackdrop.classList.remove('open');
  }
  window.closeGpaSimulator = closeGpaSimulator;

  function renderGpaCoursesList() {
    const listEl = document.getElementById('gpaCoursesList');
    if (!listEl) return;

    const courses = state.data.courses;
    listEl.innerHTML = courses.map(c => {
      const selectedGrade = state.gpaTargets[c.code] || 'A';
      return `
        <div class="gpa-course-row">
          <div class="gpa-course-left">
            <div class="gpa-course-code">${c.code}</div>
            <div class="gpa-course-name">${c.title}</div>
            <div class="gpa-course-credits">${c.creditUnits} Credit Units</div>
          </div>
          <div>
            <select class="grade-select" data-code="${c.code}" onchange="window.updateCourseGrade('${c.code}', this.value)">
              ${Object.keys(GRADE_SCALE).map(g => `
                <option value="${g}" ${g === selectedGrade ? 'selected' : ''}>${GRADE_SCALE[g].label}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }).join('');
  }

  window.updateCourseGrade = function(code, grade) {
    state.gpaTargets[code] = grade;
    recalculateGpa();
  };

  window.applyGpaPreset = function(presetType) {
    const courses = state.data.courses;
    courses.forEach((c, idx) => {
      if (presetType === 'first') {
        state.gpaTargets[c.code] = 'A';
      } else if (presetType === 'upper') {
        state.gpaTargets[c.code] = (idx % 2 === 0) ? 'A' : 'B+';
      } else if (presetType === 'pass') {
        state.gpaTargets[c.code] = (idx % 2 === 0) ? 'B' : 'C';
      }
    });
    renderGpaCoursesList();
    recalculateGpa();
    showToast(`Applied ${presetType === 'first' ? 'First Class' : presetType === 'upper' ? 'Upper Second' : 'Pass'} goal preset!`);
  };

  function recalculateGpa() {
    const courses = state.data.courses;
    let totalGradePoints = 0;
    let totalCredits = 0;

    courses.forEach(c => {
      const grade = state.gpaTargets[c.code] || 'A';
      const gp = GRADE_SCALE[grade] ? GRADE_SCALE[grade].gp : 5.0;
      totalGradePoints += (c.creditUnits * gp);
      totalCredits += c.creditUnits;
    });

    const projectedGpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '5.00';

    const gpaValEl = document.getElementById('projectedGpaValue');
    const badgeEl = document.getElementById('gpaHonoursBadge');
    const creditsEl = document.getElementById('gpaTotalCreditsLabel');

    if (gpaValEl) gpaValEl.textContent = projectedGpa;
    if (creditsEl) creditsEl.textContent = `${totalCredits.toFixed(1)} Total Credit Units`;

    if (badgeEl) {
      const num = parseFloat(projectedGpa);
      if (num >= 4.40) {
        badgeEl.className = 'badge-pill success';
        badgeEl.textContent = '🏆 First Class Honours';
      } else if (num >= 3.60) {
        badgeEl.className = 'badge-pill success';
        badgeEl.textContent = '🌟 Second Class (Upper)';
      } else if (num >= 2.80) {
        badgeEl.className = 'badge-pill warning';
        badgeEl.textContent = '📘 Second Class (Lower)';
      } else if (num >= 2.00) {
        badgeEl.className = 'badge-pill neutral';
        badgeEl.textContent = 'Pass';
      } else {
        badgeEl.className = 'badge-pill danger';
        badgeEl.textContent = '🚨 Academic Warning / Retake';
      }
    }
  }

  // ==========================================
  // Render: Financials Tab
  // ==========================================
  function renderFinancialsTab() {
    const container = document.getElementById('tab-financials');
    if (!container) return;

    const fees = state.data.feeSummary;

    container.innerHTML = `
      <!-- High-Trust Hardware Keystore Security Banner -->
      <div class="trust-shield-card">
        <div class="shield-icon-bubble">🛡️</div>
        <div>
          <div class="trust-title">High-Trust Financial Ledger</div>
          <div class="trust-desc">
            Directly verified against ISBAT ISMIS records. Stored in local hardware-encrypted keystore.
          </div>
        </div>
      </div>

      <!-- Financial Clearance Overview -->
      <div class="financial-summary-grid">
        <div class="fee-stat-card">
          <div class="fee-stat-label">Total Billed</div>
          <div class="fee-stat-amount">${fees.totalBilled}</div>
        </div>
        <div class="fee-stat-card">
          <div class="fee-stat-label">Total Paid</div>
          <div class="fee-stat-amount" style="color:var(--accent-primary);">${fees.totalPaid}</div>
        </div>
      </div>

      <div class="stitch-card ${fees.outstandingBalance !== '0.00' ? 'glow-accent' : ''}">
        <div class="card-header-flex">
          <span class="card-subtitle">Current Fee Balance</span>
          <span class="badge-pill ${fees.outstandingBalance !== '0.00' ? 'warning' : 'success'}">${fees.clearanceBadge}</span>
        </div>
        <div class="fee-stat-amount ${fees.outstandingBalance !== '0.00' ? 'due-color' : ''}" style="font-size:26px; margin: 4px 0 10px 0;">
          ${fees.outstandingBalance}
        </div>
        <div style="font-size:11px; color:var(--text-secondary); line-height:1.4;">
          Clearance for Final University Examination requires clearing all statutory GUILD and tuition balance.
        </div>
      </div>

      <!-- Itemized Ledger List -->
      <div class="timeline-section-title">
        <span>Statutory &amp; Tuition Payments</span>
        <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted);">${fees.paymentsBreakdown.length} Records</span>
      </div>

      <div class="ledger-list">
        ${fees.paymentsBreakdown.map(item => `
          <div class="ledger-item">
            <div class="ledger-item-left">
              <span class="ledger-category">${item.category}</span>
              <span class="ledger-period">${item.item}</span>
            </div>
            <div class="ledger-item-right">
              <span class="badge-pill ${item.status === 'Paid' ? 'success' : item.status === 'Due' ? 'danger' : 'warning'}">${item.status}</span>
              <span class="ledger-amount">${item.amount}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Connection / Portal Switch trigger -->
      <button class="btn-secondary" style="margin-top: 18px;" onclick="window.openSyncSheet()">
        ${state.isPortalSynced ? '🔄 Manage Portal Connection' : '🔐 Connect ISBAT Portal for Live Sync'}
      </button>
    `;
  }

  // ==========================================
  // Render: Interactive Campus Feed Tab (Compatibility)
  // ==========================================
  function renderFeedTab() {
    const container = document.getElementById('tab-feed');
    if (!container) return;

    const feeds = state.data.campusFeed || [];

    // Filter categories count
    const totalCount = feeds.filter(f => !state.dismissedFeedIds.includes(f.id)).length;
    const deadlinesCount = feeds.filter(f => !state.dismissedFeedIds.includes(f.id) && f.category === 'Deadlines').length;
    const guildCount = feeds.filter(f => !state.dismissedFeedIds.includes(f.id) && f.category === 'Guild Activities').length;
    const academicsCount = feeds.filter(f => !state.dismissedFeedIds.includes(f.id) && f.category === 'Academics').length;

    // Filter active items
    const visibleFeeds = feeds.filter(f => {
      if (state.dismissedFeedIds.includes(f.id)) return false;
      if (state.feedFilter === 'All') return true;
      return f.category === state.feedFilter;
    });

    const pendingTasks = state.tasks.filter(t => !t.completed);

    container.innerHTML = `
      <!-- Saved Tasks & Deadlines Section -->
      <div class="tasks-hero-card">
        <div class="tasks-hero-header">
          <div class="tasks-hero-title">
            <span>📌 My Action Items &amp; Deadlines</span>
            <span class="badge-pill ${pendingTasks.length > 0 ? 'warning' : 'success'}">${pendingTasks.length} Pending</span>
          </div>
          ${state.tasks.some(t => t.completed) ? `
            <button class="whatif-btn" onclick="window.clearCompletedTasks()">Clear Completed</button>
          ` : ''}
        </div>

        <div class="tasks-list">
          ${state.tasks.length === 0 ? `
            <div style="font-size:11px; color:var(--text-muted); text-align:center; padding:8px;">No pending tasks. Add deadlines from notices below!</div>
          ` : state.tasks.map(t => `
            <div class="task-item-row ${t.completed ? 'completed' : ''}">
              <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="window.toggleTask('${t.id}')" />
              <span class="task-text">${t.title}</span>
              <span class="task-badge-date">${t.date}</span>
              <button type="button" class="task-delete-btn" onclick="window.deleteTask('${t.id}')" title="Delete Task">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="feed-filter-bar">
        <button type="button" class="feed-filter-pill ${state.feedFilter === 'All' ? 'active' : ''}" onclick="window.setFeedFilter('All')">
          All (${totalCount})
        </button>
        <button type="button" class="feed-filter-pill ${state.feedFilter === 'Deadlines' ? 'active' : ''}" onclick="window.setFeedFilter('Deadlines')">
          Deadlines (${deadlinesCount})
        </button>
        <button type="button" class="feed-filter-pill ${state.feedFilter === 'Guild Activities' ? 'active' : ''}" onclick="window.setFeedFilter('Guild Activities')">
          Guild (${guildCount})
        </button>
        <button type="button" class="feed-filter-pill ${state.feedFilter === 'Academics' ? 'active' : ''}" onclick="window.setFeedFilter('Academics')">
          Academics (${academicsCount})
        </button>
      </div>

      <!-- Feed List -->
      <div class="feed-list">
        ${visibleFeeds.length === 0 ? `
          <div class="stitch-card" style="text-align:center; color:var(--text-muted); font-size:12px; padding:24px;">
            No announcements found in this category.
          </div>
        ` : visibleFeeds.map(feed => {
          const isAdded = state.tasks.some(t => t.title.toLowerCase().includes(feed.title.toLowerCase().substring(0, 15)));
          return `
            <div class="feed-card ${feed.priority === 'high' ? 'urgent' : ''}" id="feed-card-${feed.id}">
              <div class="feed-top-row">
                <span class="badge-pill ${feed.priority === 'high' ? 'danger' : feed.priority === 'warning' ? 'warning' : 'neutral'}">${feed.tag}</span>
                <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${feed.date}</span>
              </div>
              <div class="feed-title">${feed.title}</div>
              <div class="feed-content">${feed.content}</div>
              <div class="feed-footer">
                <span>Issued by: ${feed.source}</span>
                <span style="color:var(--accent-primary);">Verified ✓</span>
              </div>

              <!-- Actionable Buttons -->
              <div class="feed-card-actions">
                <button type="button" class="feed-action-btn ${isAdded ? 'primary' : ''}" onclick="window.addTaskFromFeed('${feed.id}')">
                  ${isAdded ? '✓ In Tasks' : '+ Add to Tasks'}
                </button>
                <button type="button" class="feed-action-btn" onclick="window.dismissFeedItem('${feed.id}')">
                  Dismiss
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Interactive Feed Actions
  window.setFeedFilter = function(filter) {
    state.feedFilter = filter;
    renderFeedTab();
  };

  window.toggleTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));
      renderFeedTab();
    }
  };

  window.deleteTask = function(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));
    renderFeedTab();
    showToast('Task removed');
  };

  window.clearCompletedTasks = function() {
    state.tasks = state.tasks.filter(t => !t.completed);
    localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));
    renderFeedTab();
    showToast('Cleared completed tasks');
  };

  window.addTaskFromFeed = function(feedId) {
    const feed = state.data.campusFeed.find(f => f.id === feedId);
    if (!feed) return;

    if (!state.tasks.some(t => t.title === feed.title)) {
      const taskItem = {
        id: 'task-' + Date.now(),
        title: feed.title,
        date: feed.deadlineDate || feed.date,
        completed: false,
        category: feed.category || 'General'
      };
      state.tasks.unshift(taskItem);
      localStorage.setItem('coursemate_tasks', JSON.stringify(state.tasks));

      // Also mirror to assignments
      state.assignments.unshift({
        id: taskItem.id,
        code: 'ANNOUNCE',
        title: feed.title,
        dueDate: '2026-10-05',
        dueTime: '23:59',
        priority: feed.priority === 'high' ? 'High' : 'Medium',
        completed: false
      });
      localStorage.setItem('coursemate_assignments', JSON.stringify(state.assignments));

      renderFeedTab();
      showToast('✓ Added deadline to My Tasks!');
    } else {
      showToast('Task already exists in your action items.');
    }
  };

  window.dismissFeedItem = function(feedId) {
    const cardEl = document.getElementById(`feed-card-${feedId}`);
    if (cardEl) {
      cardEl.classList.add('dismissed');
      setTimeout(() => {
        if (!state.dismissedFeedIds.includes(feedId)) {
          state.dismissedFeedIds.push(feedId);
          localStorage.setItem('coursemate_dismissed_feed', JSON.stringify(state.dismissedFeedIds));
        }
        renderFeedTab();
        showToast('Notice dismissed.');
      }, 300);
    }
  };

  // ==========================================
  // Progressive Zero-Friction Onboarding Flow
  // ==========================================
  function showOnboarding(step) {
    state.onboardingStep = step;
    onboardingOverlay.classList.remove('hidden');

    const contentBox = document.getElementById('onboardingDynamicContent');
    const step1Dot = document.getElementById('stepDot1');
    const step2Dot = document.getElementById('stepDot2');

    if (step === 1) {
      step1Dot.className = 'step-dot active';
      step2Dot.className = 'step-dot';

      contentBox.innerHTML = `
        <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Step 1 of 2: Select Campus</div>
        <div class="cohort-option-card selected" style="display:flex; align-items:center; gap:12px;">
          <div class="campus-avatar" style="width:36px; height:36px; font-size:14px;">ISB</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:var(--text-primary);">${COURSEMATE_DATA.university.name}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${COURSEMATE_DATA.university.campus}</div>
          </div>
          <span style="margin-left:auto; color:var(--accent-primary); font-weight:700;">✓</span>
        </div>
        <div style="margin-top:12px; font-size:11px; color:var(--text-muted); text-align:center;">
          Zero friction: No login required to browse schedule &amp; lectures.
        </div>
      `;

      document.getElementById('onboardingActionBtn').textContent = 'Next: Choose Cohort →';
      document.getElementById('onboardingActionBtn').onclick = () => showOnboarding(2);

    } else if (step === 2) {
      step1Dot.className = 'step-dot';
      step2Dot.className = 'step-dot active';

      contentBox.innerHTML = `
        <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Step 2 of 2: Select Program &amp; Cohort</div>
        <div class="cohort-select-list">
          ${COURSEMATE_DATA.cohorts.map(c => `
            <div class="cohort-option-card ${c.id === state.selectedCohort.id ? 'selected' : ''}" onclick="window.selectCohortOption('${c.id}')">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:var(--font-mono); font-size:11px; color:var(--accent-primary); font-weight:700;">Batch ${c.batch}</span>
                <span style="font-size:11px; color:var(--text-muted);">Year ${c.year} Sem ${c.semester}</span>
              </div>
              <div style="font-weight:700; font-size:13px; color:var(--text-primary); margin-top:2px;">${c.name}</div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('onboardingActionBtn').textContent = 'Enter Academic Operating System 🚀';
      document.getElementById('onboardingActionBtn').onclick = completeOnboarding;
    }
  }

  window.selectCohortOption = function(cohortId) {
    const found = COURSEMATE_DATA.cohorts.find(c => c.id === cohortId);
    if (found) {
      state.selectedCohort = found;
      showOnboarding(2);
    }
  };

  function completeOnboarding() {
    state.isOnboarded = true;
    localStorage.setItem('coursemate_onboarded', 'true');
    onboardingOverlay.classList.add('hidden');
    renderActiveTab();
    showToast(`Welcome! Loaded ${state.selectedCohort.batch} Academic Command Center.`);
  }

  // ==========================================
  // High-Trust Portal Sync Sheet
  // ==========================================
  function openSyncSheet() {
    portalSyncSheet.classList.add('open');
    sheetBackdrop.classList.add('open');
  }
  window.openSyncSheet = openSyncSheet;

  function closeSyncSheet() {
    portalSyncSheet.classList.remove('open');
    sheetBackdrop.classList.remove('open');
  }
  window.closeSyncSheet = closeSyncSheet;

  async function handlePortalSync() {
    const submitBtn = document.getElementById('syncSubmitBtn');
    const originalText = submitBtn.innerHTML;
    const errorBanner = document.getElementById('syncErrorBanner');
    const errorMsgEl = document.getElementById('syncErrorMessage');

    const username = document.getElementById('syncUsername').value.trim();
    const password = document.getElementById('syncPassword').value;
    const useMock = document.getElementById('syncUseMock') ? document.getElementById('syncUseMock').checked : false;

    // Reset previous error state
    if (errorBanner) errorBanner.style.display = 'none';

    // State 1: Connecting to ISBAT ERP...
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
      <span>Connecting to ISBAT ERP...</span>
    `;

    // State 2: Reading Schedule & Fees... (after 900ms)
    const statusTimer = setTimeout(() => {
      submitBtn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Reading Schedule &amp; Fees...</span>
      `;
    }, 900);

    try {
      const response = await fetch('/api/sync-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          useMock
        })
      });

      clearTimeout(statusTimer);
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // State 3: Sync Complete!
        submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Sync Complete!</span>
        `;

        // Update application state with real extracted student record
        state.isPortalSynced = true;
        state.data = {
          ...state.data,
          student: data.student || state.data.student,
          feeSummary: data.feeSummary || state.data.feeSummary,
          courses: (data.courses && data.courses.length > 0) ? data.courses : state.data.courses,
          scrapedAt: data.scrapedAt
        };

        // Offline-First persistence
        localStorage.setItem('coursemate_synced', 'true');
        localStorage.setItem('coursemate_student_data', JSON.stringify(state.data));

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          closeSyncSheet();
          renderActiveTab();
          const studentName = (state.data.student && state.data.student.name) ? state.data.student.name : 'Student';
          showToast(`✓ Verified Portal Sync: Welcome, ${studentName}!`);
        }, 600);

      } else {
        // Error handling: Display crisp error banner inside drawer
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        const errorMsg = data.message || 'Invalid ISBAT username or password. Please verify your credentials.';
        if (errorMsgEl) errorMsgEl.textContent = errorMsg;
        if (errorBanner) {
          errorBanner.style.display = 'flex';
          errorBanner.style.animation = 'none';
          errorBanner.offsetHeight; // reflow to trigger animation
          errorBanner.style.animation = 'shakeError 0.35s var(--spring-ease)';
        }
        showToast('✗ Portal Sync Failed: ' + errorMsg);
      }

    } catch (err) {
      clearTimeout(statusTimer);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      const networkMsg = 'Network error connecting to backend sync service: ' + err.message;
      if (errorMsgEl) errorMsgEl.textContent = networkMsg;
      if (errorBanner) errorBanner.style.display = 'flex';
      showToast('✗ Connection Error: ' + err.message);
    }
  }

  // ==========================================
  // Helpers & Theme Utilities
  // ==========================================
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
      icon.innerHTML = t === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  window.showToast = showToast;
});
