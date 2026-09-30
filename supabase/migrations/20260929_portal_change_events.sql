-- =============================================================
-- CourseMate - Portal Change Events & Background Watcher
-- Migration: 20260929_portal_change_events.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS public.portal_change_events (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('GRADE', 'EXAM', 'FINANCE', 'ENROLLMENT')),
  category    TEXT        NOT NULL,
  severity    VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'urgent')),
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  deep_link   TEXT        NOT NULL DEFAULT '/courses',
  course_code VARCHAR(20),
  meta        JSONB,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_change_events_profile
  ON public.portal_change_events (profile_id, is_read, created_at DESC);

ALTER TABLE public.portal_change_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_change_events' AND policyname = 'Users read own portal change events'
  ) THEN
    CREATE POLICY "Users read own portal change events"
      ON public.portal_change_events FOR SELECT
      USING (auth.uid() = profile_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_change_events' AND policyname = 'Users update own portal change events'
  ) THEN
    CREATE POLICY "Users update own portal change events"
      ON public.portal_change_events FOR UPDATE
      USING (auth.uid() = profile_id)
      WITH CHECK (auth.uid() = profile_id);
  END IF;
END $$;
