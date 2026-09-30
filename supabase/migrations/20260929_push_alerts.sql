-- =============================================================
-- CourseMate - Push Subscriptions & Portal Alerts
-- Migration: 20260929_push_alerts.sql
-- =============================================================

-- ── Push Subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint          TEXT        NOT NULL UNIQUE,
  subscription_json TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile
  ON public.push_subscriptions (profile_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── Portal Alerts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_alerts (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL,
  severity    TEXT        NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  course_code VARCHAR(20),
  route_hint  TEXT        NOT NULL DEFAULT 'courses',
  meta        TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_alerts_profile_unread
  ON public.portal_alerts (profile_id, is_read, created_at DESC);

ALTER TABLE public.portal_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own alerts"
  ON public.portal_alerts FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users mark own alerts read"
  ON public.portal_alerts FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── Add snapshot_json column to student_academic_records if missing ──────────
-- (stores the last known portal snapshot for diff comparisons)
ALTER TABLE public.student_academic_records
  ADD COLUMN IF NOT EXISTS snapshot_json TEXT;
