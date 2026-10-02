import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, BellOff, X, Zap, AlertTriangle, Info, CheckCircle,
  Calendar, DollarSign, BookOpen, Users, RefreshCw, Loader2,
  ChevronRight, CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  registerServiceWorker,
  PushSubscriptionStatus,
} from '../../services/notifications';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PortalAlert {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  course_code?: string;
  route_hint: 'planner' | 'profile' | 'courses' | 'campus';
  is_read: boolean;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  exam_date_change:  Calendar,
  timetable_change:  Calendar,
  coursework_mark:   BookOpen,
  result_released:   BookOpen,
  attendance_drop:   AlertTriangle,
  fee_status_change: DollarSign,
  fee_balance_change:DollarSign,
  new_course:        Users,
  dropped_course:    Users,
  test:              Zap,
};

const SEVERITY_COLOR = {
  critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  warning:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  info:     'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

const SEVERITY_DOT = {
  critical: 'bg-rose-500',
  warning:  'bg-amber-500',
  info:     'bg-indigo-500',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Alert Card ─────────────────────────────────────────────────────────────

const AlertCard: React.FC<{
  alert: PortalAlert;
  onMarkRead: (id: string) => void;
  onNavigate: (hint: string) => void;
}> = ({ alert, onMarkRead, onNavigate }) => {
  const Icon = CATEGORY_ICON[alert.category] || Info;
  const colorClass = SEVERITY_COLOR[alert.severity];

  return (
    <div
      className={`ios-liquid-card p-3.5 space-y-2 transition-all ${alert.is_read ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!alert.is_read && (
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[alert.severity]} shrink-0`} />
            )}
            {alert.course_code && (
              <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {alert.course_code}
              </span>
            )}
            <span className="text-[9px] font-bold text-zinc-500 capitalize">
              {alert.category.replace(/_/g, ' ')}
            </span>
            <span className="text-[9px] text-zinc-600 ml-auto shrink-0">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="text-xs font-extrabold text-white mt-0.5 leading-tight">{alert.title}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">{alert.body}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pl-11">
        <button
          onClick={() => onNavigate(alert.route_hint)}
          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          <ChevronRight className="w-3 h-3" />
          View
        </button>
        {!alert.is_read && (
          <button
            onClick={() => onMarkRead(alert.id)}
            className="flex-1 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Mark read
          </button>
        )}
      </div>
    </div>
  );
};

// ── Notification Settings Strip ────────────────────────────────────────────

const NotificationSettings: React.FC<{
  status: PushSubscriptionStatus;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onTest: () => void;
  loading: boolean;
  testResult: string;
}> = ({ status, onSubscribe, onUnsubscribe, onTest, loading, testResult }) => (
  <div className="ios-liquid-card p-4 space-y-3 rounded-[22px]">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status.subscribed ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
      <p className="text-xs font-extrabold text-white">
        {status.subscribed ? 'Push alerts enabled' : 'Push alerts disabled'}
      </p>
      <span className="ml-auto text-[10px] font-semibold text-zinc-500">
        {status.permission === 'granted' ? 'Permitted' : status.permission === 'denied' ? 'Blocked in browser' : 'Not yet requested'}
      </span>
    </div>

    {!status.supported && (
      <p className="text-[11px] text-amber-400 font-semibold">
        ⚠️ Push notifications are not supported in this browser.
      </p>
    )}

    {status.permission === 'denied' && (
      <p className="text-[11px] text-rose-400 font-semibold">
        Notifications are blocked. Enable them in your browser's site settings, then return here.
      </p>
    )}

    <div className="flex gap-2">
      {!status.subscribed ? (
        <button
          id="enable-push-alerts"
          onClick={onSubscribe}
          disabled={loading || !status.supported || status.permission === 'denied'}
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
          Enable Alerts
        </button>
      ) : (
        <>
          <button
            id="test-push-notification"
            onClick={onTest}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Send Test
          </button>
          <button
            id="disable-push-alerts"
            onClick={onUnsubscribe}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
          >
            <BellOff className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>

    {testResult && (
      <p className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg ${
        testResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
      }`}>
        {testResult}
      </p>
    )}
  </div>
);

// ── Main Alert Center Component ────────────────────────────────────────────

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  authToken?: string;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ isOpen, onClose, onNavigate, authToken }) => {
  const { setCurrentTab } = useApp();

  const [alerts, setAlerts] = useState<PortalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus>({
    supported: false, permission: 'default', subscribed: false, subscription: null,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Initialize SW and check push status
  useEffect(() => {
    if (!isOpen) return;
    registerServiceWorker().then(() => {
      getPushStatus().then(setPushStatus);
    });
    fetchAlerts();
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const resp = await fetch('/api/notifications/alerts', { headers });
      if (resp.ok) {
        const data = await resp.json();
        setAlerts(data.alerts || []);
      } else {
        // Graceful fallback: show mock demo alerts
        setAlerts(MOCK_ALERTS);
      }
    } catch {
      setAlerts(MOCK_ALERTS);
    } finally {
      setLoadingAlerts(false);
    }
  }, [authToken]);

  const handleSubscribe = async () => {
    setPushLoading(true);
    const result = await subscribeToPush(authToken);
    if (result.success) {
      setPushStatus(await getPushStatus());
      setTestResult('✅ Alerts enabled! You\'ll now receive push notifications for exam changes, marks & fee updates.');
    } else {
      setTestResult(`⚠️ ${result.error}`);
    }
    setPushLoading(false);
  };

  const handleUnsubscribe = async () => {
    setPushLoading(true);
    await unsubscribeFromPush();
    setPushStatus(await getPushStatus());
    setTestResult('');
    setPushLoading(false);
  };

  const handleTest = async () => {
    setPushLoading(true);
    setTestResult('');
    const result = await sendTestNotification(authToken);
    setTestResult(result.success ? `✅ ${result.message}` : `⚠️ ${result.message}`);
    setPushLoading(false);
  };

  const handleMarkRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
    // Best-effort server update
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers,
      body: JSON.stringify({ alertId: id }),
    }).catch(() => {});
  };

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers,
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  };

  const handleNavigate = (routeHint: string) => {
    const tabMap: Record<string, string> = {
      planner: 'planner',
      profile: 'profile',
      courses: 'courses',
      campus:  'campus',
    };
    const tab = tabMap[routeHint] || 'courses';
    setCurrentTab(tab as any);
    onClose();
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#0E0F1A] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Alert Center</h2>
              <p className="text-[10px] text-zinc-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up ✓'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'alerts' && unreadCount > 0 && (
              <button
                id="mark-all-read"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                All read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex p-3 gap-2 border-b border-white/[0.04]">
          {(['alerts', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              id={`alert-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab === 'alerts' && unreadCount > 0 ? (
                <span className="flex items-center justify-center gap-1.5">
                  Alerts
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              ) : tab === 'alerts' ? 'Alerts' : 'Push Settings'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'settings' && (
            <NotificationSettings
              status={pushStatus}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
              onTest={handleTest}
              loading={pushLoading}
              testResult={testResult}
            />
          )}

          {activeTab === 'alerts' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Portal Alerts · {alerts.length} total
                </p>
                <button
                  id="refresh-alerts"
                  onClick={fetchAlerts}
                  disabled={loadingAlerts}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAlerts ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingAlerts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-zinc-800/40 rounded-[18px] animate-pulse" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-sm font-extrabold text-zinc-300">No alerts yet</p>
                  <p className="text-xs text-zinc-500">
                    Enable push alerts to be notified about exam changes, marks, and fee updates.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Enable Alerts
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkRead={handleMarkRead}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-zinc-600 text-center">
            CourseMate monitors your university portal for changes and alerts you instantly.
          </p>
        </div>
      </div>
    </>
  );
};

// ── Mock alerts for offline / dev mode ─────────────────────────────────────
const MOCK_ALERTS: PortalAlert[] = [
  {
    id: 'mock-1',
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
    id: 'mock-2',
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
    id: 'mock-3',
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
    id: 'mock-4',
    category: 'fee_status_change',
    severity: 'info',
    title: '✅ Fee clearance granted',
    body: 'Your fee account is now fully cleared for Semester 2, 2023/2024.',
    route_hint: 'profile',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Bell button with badge (for TopBar) ────────────────────────────────────
export const AlertBellButton: React.FC<{
  onClick: () => void;
  unreadCount: number;
}> = ({ onClick, unreadCount }) => (
  <button
    id="open-alert-center"
    onClick={onClick}
    className="relative w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
    aria-label={`Alert Center${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
  >
    <Bell className="w-4.5 h-4.5" />
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-[#0A0B14] text-white text-[8px] font-extrabold flex items-center justify-center leading-none animate-in zoom-in duration-150">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
);
