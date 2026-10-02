import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Moon,
  Sun,
  RefreshCw,
  ChevronDown,
  Download,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Coins,
  School,
  Bell,
  BellOff,
  Zap,
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  PushSubscriptionStatus,
} from '../../services/notifications';

export const ProfileScreen: React.FC = () => {
  const {
    student,
    updateStudent,
    connections,
    triggerConnectionSync,
    theme,
    toggleTheme,
    openModal,
    feeSummary,
    isPortalSynced,
    resetOnboarding,
    selectedUniversity,
  } = useApp();

  const activeUni = student?.university || selectedUniversity || 'ISBAT University';
  const portalLabel = activeUni === 'ISBAT University' ? 'ISBAT ISMIS' : `${activeUni} Portal`;

  const [showAdvancedSync, setShowAdvancedSync] = useState(false);
  const [notifDeadlines, setNotifDeadlines] = useState(true);
  const [notifTimetable, setNotifTimetable] = useState(true);
  const [notifStudyGaps, setNotifStudyGaps] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(student?.name || 'Guest Student');

  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus>({
    supported: false,
    permission: 'default',
    subscribed: false,
    subscription: null,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  // Portal connection diagnostic state
  const [diagUsername, setDiagUsername] = useState('');
  const [diagPassword, setDiagPassword] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    success: boolean;
    studentName?: string;
    regNo?: string;
    coursesFound?: number;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  const handleTestConnection = async () => {
    if (!diagUsername.trim() || !diagPassword.trim()) {
      setDiagResult({ success: false, error: 'Enter your portal username and password above.' });
      return;
    }
    setDiagLoading(true);
    setDiagResult(null);
    try {
      const resp = await fetch('/api/scrape/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: diagUsername,
          password: diagPassword,
          university: activeUni,
        }),
      });
      const data = await resp.json();
      setDiagResult(data);
    } catch (err: any) {
      setDiagResult({ success: false, error: err.message || 'Network error — server may be offline.' });
    } finally {
      setDiagLoading(false);
    }
  };

  React.useEffect(() => {
    getPushStatus().then(setPushStatus);
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    if (pushStatus.subscribed) {
      await unsubscribeFromPush();
      setPushStatus(await getPushStatus());
      setPushFeedback('Push alerts disabled.');
    } else {
      const res = await subscribeToPush();
      setPushStatus(await getPushStatus());
      if (res.success) {
        setPushFeedback('✅ Web Push enabled! Live alerts for exams, marks & fees active.');
      } else {
        setPushFeedback(`⚠️ ${res.error}`);
      }
    }
    setPushLoading(false);
  };

  const handleSendTestPush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    const res = await sendTestNotification();
    setPushFeedback(res.success ? `✅ ${res.message}` : `⚠️ ${res.message}`);
    setPushLoading(false);
  };

  const handleSaveProfile = () => {
    updateStudent({ name: editedName, preferredName: editedName.split(' ')[0] });
    setIsEditing(false);
  };

  const studentDisplayName = student?.name || 'Guest Student';
  const studentInitials = studentDisplayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('') || 'GS';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. Student Identity Card */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md liquid-sheen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
              {studentInitials}
            </div>

            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-3.5 py-1.5 text-sm rounded-full bg-[#12131F] border border-white/[0.1] text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="bg-white hover:bg-zinc-100 text-black px-4 py-1.5 text-xs font-extrabold rounded-full shadow-sm transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {studentDisplayName}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
              <p className="text-xs font-medium text-zinc-400 mt-0.5">
                Reg / ID: {student?.regNumber || student?.studentId || 'Not Synced'} · {student?.programme || 'STEM Curriculum'}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-medium">
                <span>{student?.university || 'ISBAT University'}</span>
                <span aria-hidden="true">·</span>
                <span>Year {student?.year || 1}, Semester {student?.semester || 1}</span>
                {student?.academicStatus && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400/90 font-bold">{student.academicStatus}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 sm:border-l sm:border-white/[0.08] sm:pl-6">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">
                Cumulative GPA
              </span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {(student?.currentGpa || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">
                Credits Enrolled
              </span>
              <p className="text-2xl font-extrabold text-indigo-400 tabular-nums">
                {student?.creditsCurrentSemester || 0} CU
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Academic Connections (ISMIS, LMS, WhatsApp, Documents) */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md space-y-4 liquid-sheen">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">
              Academic Connections
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Synced information sources powering your daily command center
            </p>
          </div>

          <button
            onClick={() => openModal('source-connect')}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-full shadow-sm shadow-indigo-500/20 transition-all"
          >
            + Connect Source
          </button>
        </div>

        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#181A27] border border-white/[0.08] shadow-sm"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">
                    {conn.name}
                  </h3>
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      conn.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {conn.status === 'connected' ? 'Connected' : 'Error'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium truncate">
                  Last synced: {conn.lastSync}
                </p>
              </div>

              <button
                onClick={() => triggerConnectionSync(conn.id)}
                className="circle-button-skeuo w-8 h-8 shadow-sm"
                title="Sync now"
                aria-label={`Sync ${conn.name}`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-300 hover:text-indigo-400 transition-colors" />
              </button>
            </div>
          ))}
        </div>

        {/* Provenance Explainer Accordion */}
        <div className="pt-2">
          <button
            onClick={() => setShowAdvancedSync(!showAdvancedSync)}
            className="text-xs font-extrabold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>How CourseMate reconciles conflict provenance</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showAdvancedSync ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showAdvancedSync && (
            <div className="mt-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-white">Strict Provenance Hierarchy:</strong> Official university registrar systems (e.g. ISMIS / AIMS) hold priority level 1. Moodle LMS holds level 2. Class rep WhatsApp announcements hold level 3.
              </p>
              <p>
                When a discrepancy arises, the app flags an actionable audit conflict (e.g., the Algorithms Midterm banner) allowing you to verify timestamps and confirm with your department administrator.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Official University Fee Ledger (ISMIS Reconciled) */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover shadow-hi-fi-md space-y-4 liquid-sheen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill-tag-coral text-[10px] py-0.5 px-2.5 font-bold uppercase tracking-wider">
                Financial Statement
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPortalSynced
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPortalSynced ? 'ERP Reconciled' : 'Not Synced'}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-1">
              Official University Fee Ledger
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Real-time tuition, guild, and statutory NCHE payment balances from {portalLabel}
            </p>
          </div>

          <button
            onClick={() => openModal('source-connect', { initialSource: 'portal' })}
            className="bg-white hover:bg-zinc-100 text-black px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isPortalSynced ? 'Refresh Fee Data' : 'Connect Portal to Sync'}</span>
          </button>
        </div>

        {feeSummary ? (
          <div className="space-y-4 pt-1">
            {/* 3 High-Level Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#181A27] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                  Total Billed
                </span>
                <p className="text-sm sm:text-base font-extrabold text-white mt-1">
                  {feeSummary.totalBilled || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181A27] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                  Total Paid
                </span>
                <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
                  {feeSummary.totalPaid || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181A27] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                  Outstanding Balance
                </span>
                <p className="text-sm sm:text-base font-extrabold text-amber-300 mt-1">
                  {feeSummary.outstandingBalance || 'Cleared'}
                </p>
              </div>
            </div>

            {/* Itemized Payment Breakdown */}
            {feeSummary.paymentsBreakdown && feeSummary.paymentsBreakdown.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-extrabold text-zinc-300">
                  Itemized Dues & Semester Payment Audit
                </h3>
                <div className="space-y-2">
                  {feeSummary.paymentsBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#141523] border border-white/[0.06]"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-white truncate">
                          {item.item}
                        </p>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold py-1 px-3 rounded-full shrink-0 ${
                          item.status.toLowerCase() === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#141523] border border-dashed border-white/[0.12] text-center space-y-2.5">
            <Coins className="w-8 h-8 text-zinc-500 mx-auto" />
            <div>
              <p className="text-xs font-bold text-white">
                No Official Fee Ledger Synced
              </p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto mt-0.5">
                Connect your {portalLabel} to fetch your official semester billing, payments breakdown, and clearances.
              </p>
            </div>
            <button
              onClick={() => openModal('source-connect', { initialSource: 'portal' })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Sync {activeUni} Portal Now
            </button>
          </div>
        )}
      </section>

      {/* Portal Connection Diagnostics */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover space-y-4 liquid-sheen">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <h2 className="text-base font-extrabold text-white">Portal Connection Diagnostics</h2>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Verify that the {portalLabel} Playwright adapter can authenticate and fetch your academic data. Results are not stored.
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="diag-username">
                Student ID / Username
              </label>
              <input
                id="diag-username"
                type="text"
                value={diagUsername}
                onChange={(e) => setDiagUsername(e.target.value)}
                placeholder="e.g. HECS26DA"
                autoComplete="username"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#12131F] border border-white/[0.1] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider" htmlFor="diag-password">
                Portal Password
              </label>
              <input
                id="diag-password"
                type="password"
                value={diagPassword}
                onChange={(e) => setDiagPassword(e.target.value)}
                placeholder="Your ERP password"
                autoComplete="current-password"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#12131F] border border-white/[0.1] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={diagLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            {diagLoading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Connecting to {portalLabel}…</span></>
            ) : (
              <><Activity className="w-3.5 h-3.5" /><span>Test Portal Connection</span></>
            )}
          </button>

          {diagResult && (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 ${
                diagResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/25'
                  : 'bg-rose-500/10 border-rose-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                {diagResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className={`text-xs font-extrabold ${
                  diagResult.success ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {diagResult.success ? 'Connection Verified' : 'Connection Failed'}
                </span>
                {diagResult.latencyMs !== undefined && (
                  <span className="ml-auto text-[11px] text-zinc-400 font-medium">
                    {diagResult.latencyMs}ms
                  </span>
                )}
              </div>

              {diagResult.success ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Student', value: diagResult.studentName || '—' },
                    { label: 'Reg No', value: diagResult.regNo || '—' },
                    { label: 'Courses', value: String(diagResult.coursesFound ?? '—') },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-xs font-extrabold text-white mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-rose-200 font-medium leading-snug">
                  {diagResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Notification Preferences (Tactile iOS Toggle Switches) */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover space-y-4 liquid-sheen">
        <div>
          <h2 className="text-base font-extrabold text-white">
            Notification Alerts & Timing
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Fine-tune critical academic reminders and study nudges
          </p>
        </div>

        {/* Web Push Master Card */}
        <div className="p-4 rounded-2xl bg-[#171926] border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  System Web Push Alerts
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      pushStatus.subscribed ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {pushStatus.subscribed
                    ? 'Receiving native push alerts on this device'
                    : 'Get native lock-screen notifications for exam shifts & grades'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePush}
              disabled={pushLoading || !pushStatus.supported || pushStatus.permission === 'denied'}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 disabled:opacity-50 ${
                pushStatus.subscribed ? 'bg-indigo-600' : 'bg-[#25283A]'
              }`}
              role="switch"
              aria-checked={pushStatus.subscribed}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  pushStatus.subscribed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {pushStatus.subscribed && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={pushLoading}
                className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {pushLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 text-amber-400" />
                )}
                <span>Send Test Notification</span>
              </button>
            </div>
          )}

          {pushFeedback && (
            <p
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                pushFeedback.startsWith('✅')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {pushFeedback}
            </p>
          )}
        </div>

        <div className="space-y-3.5">
          {[
            {
              title: 'Assignment Deadline Alerts',
              desc: 'Pushes 48h, 24h, and 2h prior to submission cutoff.',
              state: notifDeadlines,
              setter: setNotifDeadlines,
            },
            {
              title: 'Class Room & Timetable Shifts',
              desc: 'Instant notice if a venue changes or lecturer reschedules.',
              state: notifTimetable,
              setter: setNotifTimetable,
            },
            {
              title: 'Free Slot Study Nudges',
              desc: 'Suggests high-yield review topics during timetable gaps.',
              state: notifStudyGaps,
              setter: setNotifStudyGaps,
            },
          ].map(({ title, desc, state, setter }) => (
            <div
              key={title}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#181A27] border border-white/[0.08]"
            >
              <div className="pr-4">
                <h3 className="text-xs sm:text-sm font-extrabold text-white">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">{desc}</p>
              </div>

              {/* iOS Dark Switch */}
              <button
                type="button"
                onClick={() => setter(!state)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 ${
                  state ? 'bg-indigo-600' : 'bg-[#25283A]'
                }`}
                role="switch"
                aria-checked={state}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    state ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Progressive Web App (PWA) Mobile Install */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-sheen border border-indigo-500/25 bg-gradient-to-r from-indigo-950/20 via-[#13141F] to-violet-950/20 shadow-hi-fi-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              Install CourseMate App
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              PWA
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Install to home screen on Google Chrome, Android, or iPhone for instant fullscreen launch and offline timetable access.
          </p>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('coursemate:open-install'))}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>
      </section>

      {/* 5. Display Settings & Mode Indicator */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover flex items-center justify-between liquid-sheen">
        <div>
          <h2 className="text-base font-extrabold text-white">
            Interface Theme & Appearance
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Modern premium dark UI with soft rounded cards and lavender accents
          </p>
        </div>

        <div className="bg-[#181A27] border border-white/[0.08] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-zinc-200 shadow-xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#818CF8]" />
          <span>Dark iOS System</span>
        </div>
      </section>

      {/* 5. Standalone HTML Export */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-sheen">
        <div>
          <h2 className="text-base font-extrabold text-white">
            Export Standalone HTML
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Save a self-contained offline HTML version of CourseMate to import into Antigravity or open in any browser.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/coursemate.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] px-4 py-2 rounded-full text-xs font-bold text-zinc-200 hover:text-white transition-all shadow-xs"
          >
            Preview HTML ↗
          </a>
          <a
            href="/coursemate.html"
            download="coursemate-standalone.html"
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .html</span>
          </a>
        </div>
      </section>

      {/* 6. Onboarding & First-Time Setup */}
      <section className="ios-liquid-card p-5 sm:p-6 card-soft-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-sheen">
        <div>
          <h2 className="text-base font-extrabold text-white">
            Onboarding & Institutional Setup
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Walk through the progressive 3-step setup (Identity, Institution selection, and automated portal sync).
          </p>
        </div>

        <button
          onClick={resetOnboarding}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-run Onboarding</span>
        </button>
      </section>
    </div>
  );
};
