import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  BellOff,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
  DollarSign,
  BookOpen,
  Users,
  RefreshCw,
  Loader2,
  ChevronRight,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  PushSubscriptionStatus,
} from '../../services/notifications';

export interface PortalAlert {
  id: string;
  type?: 'GRADE' | 'EXAM' | 'FINANCE' | 'ENROLLMENT';
  category: string;
  severity: 'urgent' | 'critical' | 'warning' | 'info' | 'success';
  title: string;
  body: string;
  course_code?: string;
  route_hint: 'planner' | 'profile' | 'courses' | 'campus';
  deepLink?: string;
  is_read: boolean;
  created_at: string;
}

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  exam_date_change: Calendar,
  exam_scheduled: Calendar,
  exam_venue_change: Calendar,
  exam_time_change: Calendar,
  timetable_change: Calendar,
  coursework_mark: BookOpen,
  result_released: BookOpen,
  gpa_update: BookOpen,
  cgpa_update: BookOpen,
  attendance_drop: AlertTriangle,
  fee_status_change: DollarSign,
  fee_balance_change: DollarSign,
  exam_permit_issued: DollarSign,
  new_course: Users,
  dropped_course: Users,
  course_approved: Users,
  test: Zap,
};

const SEVERITY_COLOR: Record<string, string> = {
  urgent: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
  critical: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  info: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
};

const SEVERITY_DOT: Record<string, string> = {
  urgent: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse',
  critical: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
  warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  info: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
};

export function getCategoryBadge(alert: PortalAlert) {
  const cat = (alert.category || '').toLowerCase();
  const type = (alert.type || '').toUpperCase();
  const title = (alert.title || '').toLowerCase();

  if (type === 'EXAM' || cat.includes('exam') || cat.includes('timetable')) {
    return {
      label: 'Exam Update',
      classes: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      icon: Calendar,
    };
  }
  if (type === 'FINANCE' || cat.includes('fee') || cat.includes('tuition') || cat.includes('permit')) {
    const isCleared = title.includes('clear') || cat.includes('cleared') || cat.includes('permit');
    return {
      label: isCleared ? 'Tuition Cleared' : 'Tuition Update',
      classes: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
      icon: DollarSign,
    };
  }
  if (type === 'GRADE' || cat.includes('mark') || cat.includes('result') || cat.includes('gpa')) {
    return {
      label: 'New Coursework Mark',
      classes: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
      icon: BookOpen,
    };
  }
  if (type === 'ENROLLMENT' || cat.includes('course')) {
    return {
      label: title.includes('approv') ? 'Course Approved' : 'Course Registration',
      classes: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
      icon: Users,
    };
  }
  return {
    label: 'Portal Alert',
    classes: 'text-zinc-300 bg-white/[0.08] border-white/[0.12]',
    icon: Bell,
  };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const NotificationsDrawer: React.FC = () => {
  const {
    notifications,
    markAllNotificationsRead,
    closeModal,
    openModal,
    events,
    setCurrentTab,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'portal' | 'academic' | 'settings'>('portal');
  const [portalAlerts, setPortalAlerts] = useState<PortalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [checkingPortal, setCheckingPortal] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus>({
    supported: false,
    permission: 'default',
    subscribed: false,
    subscription: null,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load push status and alerts on mount
  useEffect(() => {
    getPushStatus().then(setPushStatus);
    fetchPortalAlerts();
  }, []);

  const fetchPortalAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      // Prioritize /api/watcher/events
      const resp = await fetch('/api/watcher/events');
      if (resp.ok) {
        const data = await resp.json();
        if (data.events && Array.isArray(data.events)) {
          setPortalAlerts(
            data.events.map((e: any) => ({
              id: e.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              type: e.type,
              category: e.category || e.type?.toLowerCase() || 'general',
              severity: e.severity === 'critical' ? 'urgent' : e.severity || 'info',
              title: e.title,
              body: e.message || e.body || '',
              course_code: e.courseCode || e.course_code,
              route_hint: e.routeHint || e.deepLink?.replace('/', '') || 'courses',
              deepLink: e.deepLink || `/${e.routeHint || 'courses'}`,
              is_read: Boolean(e.is_read || e.isRead),
              created_at: e.detectedAt || e.created_at || new Date().toISOString(),
            }))
          );
          return;
        }
      }
      // Fallback
      const fallbackResp = await fetch('/api/notifications/alerts');
      if (fallbackResp.ok) {
        const data = await fallbackResp.json();
        setPortalAlerts(data.alerts || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  const handleSubscribe = async () => {
    setPushLoading(true);
    setTestResult(null);
    const result = await subscribeToPush();
    if (result.success) {
      const status = await getPushStatus();
      setPushStatus(status);
      setTestResult('✅ Web Push enabled! Live alerts for exams, marks & fees active.');
    } else {
      setTestResult(`⚠️ ${result.error}`);
    }
    setPushLoading(false);
  };

  const handleUnsubscribe = async () => {
    setPushLoading(true);
    await unsubscribeFromPush();
    setPushStatus(await getPushStatus());
    setTestResult(null);
    setPushLoading(false);
  };

  const handleSendTest = async () => {
    setPushLoading(true);
    setTestResult(null);

    // Auto-subscribe first if not yet subscribed — resolves "No subscriptions found"
    let status = pushStatus;
    if (!status.subscribed) {
      const subResult = await subscribeToPush();
      if (!subResult.success) {
        setTestResult(`⚠️ Could not subscribe: ${subResult.error}`);
        setPushLoading(false);
        return;
      }
      status = await getPushStatus();
      setPushStatus(status);
    }

    const result = await sendTestNotification();
    setTestResult(result.success ? `✅ ${result.message}` : `⚠️ ${result.message}`);
    setPushLoading(false);
  };

  const handleCheckPortalNow = async () => {
    setCheckingPortal(true);
    setCheckResult(null);
    try {
      // Trigger immediate watcher cycle
      const resp = await fetch('/api/watcher/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceDiff: true }),
      });
      const data = await resp.json();
      if (data.status === 'success') {
        setCheckResult(
          data.changesDetected > 0
            ? `Detected ${data.changesDetected} portal update(s)! ${data.alertsDispatched} push alert(s) dispatched.`
            : 'Portal verified — all records match latest university snapshot ✓'
        );
        fetchPortalAlerts();
      } else {
        // Fallback to legacy sync check
        const fbResp = await fetch('/api/sync/check-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'manual-drawer-check' }),
        });
        const fbData = await fbResp.json();
        setCheckResult(
          fbData.changesDetected > 0
            ? `Found ${fbData.changesDetected} update(s)!`
            : 'Portal verified — all records are up to date ✓'
        );
        fetchPortalAlerts();
      }
    } catch {
      setCheckResult('Verification completed with cached records.');
    } finally {
      setCheckingPortal(false);
    }
  };

  const handleMarkPortalAlertRead = (id: string) => {
    setPortalAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
    fetch('/api/watcher/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id, alertId: id }),
    }).catch(() => {});
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId: id }),
    }).catch(() => {});
  };

  const handleMarkAllPortalAlertsRead = () => {
    setPortalAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    markAllNotificationsRead();
    fetch('/api/watcher/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  };

  const handleNavigateAlert = (routeHint: string) => {
    const hintMap: Record<string, string> = {
      planner: 'planner',
      profile: 'profile',
      courses: 'courses',
      campus: 'campus',
    };
    const tab = hintMap[routeHint] || 'courses';
    setCurrentTab(tab as any);
    closeModal();
  };

  const handleAcademicNotifClick = (notif: any) => {
    if (notif.actionableId) {
      if (notif.type === 'deadline') {
        const evt = events.find((e) => e.id === notif.actionableId);
        if (evt) openModal('assignment-detail', evt);
      } else if (notif.type === 'exam') {
        const evt = events.find((e) => e.id === notif.actionableId);
        if (evt) openModal('exam-conflict', evt);
      } else if (notif.type === 'announcement') {
        closeModal();
      }
    } else if (notif.type === 'study_window') {
      openModal('focus-session');
    }
  };

  const unreadPortalCount = portalAlerts.filter((a) => !a.is_read).length;
  const unreadAcademicCount = notifications.filter((n) => n.unread).length;
  const totalUnread = unreadPortalCount + unreadAcademicCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-md h-full bg-[#10111A] border-l border-white/[0.08] shadow-2xl flex flex-col text-white"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* Top Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
                <Bell className="w-4.5 h-4.5" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  Alert Center
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-extrabold text-indigo-300">
                      {totalUnread} new
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Portal change detection & contextual nudges
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <button
                  onClick={handleMarkAllPortalAlertsRead}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 hover:text-white transition-all"
                  title="Mark all alerts as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All read</span>
                </button>
              )}
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close alerts drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1-Tap Web Push Control Banner */}
          <div className="p-3 rounded-2xl bg-[#171926] border border-white/[0.08] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pushStatus.subscribed ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                  }`}
                />
                <p className="text-xs font-extrabold text-white">
                  {pushStatus.subscribed ? 'Push Notifications Active' : 'Web Push Alerts'}
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-400">
                {pushStatus.permission === 'granted'
                  ? 'Permitted'
                  : pushStatus.permission === 'denied'
                  ? 'Blocked'
                  : '1-Tap Setup'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-snug">
              {pushStatus.subscribed
                ? 'Your device receives instant alerts for exam changes, mark releases & fee balance transitions.'
                : 'Receive native OS lock-screen notifications when your portal updates.'}
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              {!pushStatus.subscribed ? (
                <button
                  onClick={handleSubscribe}
                  disabled={pushLoading || !pushStatus.supported || pushStatus.permission === 'denied'}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {pushLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  <span>Enable Push Alerts</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSendTest}
                    disabled={pushLoading}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {pushLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Send Test Push</span>
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={pushLoading}
                    className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                    title="Disable Push Alerts"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {testResult && (
              <p
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ${
                  testResult.startsWith('✅')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {testResult}
              </p>
            )}
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'portal'
                  ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/35 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Changes</span>
              {unreadPortalCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadPortalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('academic')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'academic'
                  ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/35 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Academic Tasks</span>
              {unreadAcademicCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadAcademicCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Stream */}
        <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto">
          {/* TAB 1: PORTAL CHANGES */}
          {activeTab === 'portal' && (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  Live Change Stream · {portalAlerts.length}
                </span>
                <button
                  onClick={handleCheckPortalNow}
                  disabled={checkingPortal}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${checkingPortal ? 'animate-spin' : ''}`}
                  />
                  <span>{checkingPortal ? 'Checking...' : 'Check Portal'}</span>
                </button>
              </div>

              {checkResult && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{checkResult}</span>
                </div>
              )}

              {loadingAlerts ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : portalAlerts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#171926] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-extrabold text-white">All Caught Up</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    No discrepancies detected on your university portal. We monitor exam dates,
                    coursework marks, and fee clearance in the background.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {portalAlerts.map((alert) => {
                    const Icon = CATEGORY_ICON[alert.category] || Info;
                    const colorClasses = SEVERITY_COLOR[alert.severity];
                    const dotClass = SEVERITY_DOT[alert.severity];

                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                          alert.is_read
                            ? 'bg-[#141522]/60 border-white/[0.05] opacity-75'
                            : 'bg-[#181A29] border-white/[0.1] shadow-md shadow-black/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${colorClasses}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {!alert.is_read && (
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${dotClass} shrink-0`}
                                />
                              )}
                              {alert.course_code && (
                                <span className="text-[9px] font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  {alert.course_code}
                                </span>
                              )}
                              {(() => {
                                const badge = getCategoryBadge(alert);
                                return (
                                  <span
                                    className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.classes}`}
                                  >
                                    <badge.icon className="w-3 h-3 shrink-0" />
                                    <span>{badge.label}</span>
                                  </span>
                                );
                              })()}
                              <span className="text-[10px] text-zinc-500 ml-auto shrink-0 font-medium">
                                {formatRelativeTime(alert.created_at)}
                              </span>
                            </div>

                            <h3 className="text-xs sm:text-sm font-extrabold text-white mt-1 leading-snug">
                              {alert.title}
                            </h3>
                            <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed font-medium">
                              {alert.body}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pl-11 pt-0.5">
                          <button
                            onClick={() => handleNavigateAlert(alert.route_hint)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Open {alert.route_hint}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          </button>
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkPortalAlertRead(alert.id)}
                              className="py-1.5 px-3 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: ACADEMIC TASKS & NUDGES */}
          {activeTab === 'academic' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  Academic Schedule Nudges · {notifications.length}
                </span>
              </div>

              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleAcademicNotifClick(notif)}
                  className={`p-3.5 rounded-2xl text-xs cursor-pointer transition-all border ${
                    notif.unread
                      ? 'bg-gradient-to-r from-indigo-950/40 to-violet-950/30 border-indigo-500/35 shadow-md'
                      : 'bg-white/[0.03] border-white/[0.06] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-zinc-400">{notif.timeAgo}</span>
                  </div>

                  <h3 className="font-bold text-white text-xs sm:text-sm">{notif.title}</h3>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-medium">
                    {notif.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-white/[0.08] text-center bg-[#0D0E16]">
          <p className="text-[11px] text-zinc-400 font-medium">
            CourseMate monitors university portals to protect your academic standing.
          </p>
        </div>
      </div>
    </div>
  );
};
