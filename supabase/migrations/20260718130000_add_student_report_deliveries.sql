CREATE TABLE IF NOT EXISTS public.student_report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  period_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  release_at TIMESTAMPTZ NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sent', 'failed', 'not_configured')),
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, report_type, period_key)
);

CREATE INDEX IF NOT EXISTS student_report_deliveries_due_idx
  ON public.student_report_deliveries (email_status, release_at);

ALTER TABLE public.student_report_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own report deliveries" ON public.student_report_deliveries;
CREATE POLICY "Students can view own report deliveries"
ON public.student_report_deliveries FOR SELECT
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admin and staff can manage report deliveries" ON public.student_report_deliveries;
CREATE POLICY "Admin and staff can manage report deliveries"
ON public.student_report_deliveries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

COMMENT ON TABLE public.student_report_deliveries IS
  'Idempotent release and email history for weekly and monthly student reports.';
