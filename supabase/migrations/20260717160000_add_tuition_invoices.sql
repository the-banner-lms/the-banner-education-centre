CREATE TABLE IF NOT EXISTS public.tuition_invoice_sequences (
  academic_year INTEGER PRIMARY KEY CHECK (academic_year BETWEEN 2000 AND 2100),
  last_value BIGINT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tuition_invoice_sequences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.monthly_tuition_fees
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_submission_id UUID REFERENCES public.enrollment_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_error TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.monthly_tuition_fees
  DROP CONSTRAINT IF EXISTS monthly_tuition_fees_email_status_check;

ALTER TABLE public.monthly_tuition_fees
  ADD CONSTRAINT monthly_tuition_fees_email_status_check
  CHECK (email_status IN ('not_applicable', 'pending', 'sent', 'failed', 'not_configured'));

CREATE UNIQUE INDEX IF NOT EXISTS monthly_tuition_fees_invoice_number_uidx
  ON public.monthly_tuition_fees (invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS monthly_tuition_fees_payment_submission_uidx
  ON public.monthly_tuition_fees (payment_submission_id)
  WHERE payment_submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS monthly_tuition_fees_due_status_idx
  ON public.monthly_tuition_fees (due_date, status);

CREATE OR REPLACE FUNCTION public.next_tuition_invoice_number(
  p_academic_year INTEGER,
  p_prefix TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value BIGINT;
  v_prefix TEXT;
BEGIN
  IF p_academic_year < 2000 OR p_academic_year > 2100 THEN
    RAISE EXCEPTION 'Invalid academic year';
  END IF;

  v_prefix := upper(regexp_replace(trim(p_prefix), '[^A-Z0-9-]', '-', 'g'));
  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN
    RAISE EXCEPTION 'Invalid invoice prefix';
  END IF;

  INSERT INTO public.tuition_invoice_sequences (academic_year, last_value, updated_at)
  VALUES (p_academic_year, 1, timezone('utc'::text, now()))
  ON CONFLICT (academic_year) DO UPDATE
  SET last_value = public.tuition_invoice_sequences.last_value + 1,
      updated_at = timezone('utc'::text, now())
  RETURNING last_value INTO v_next_value;

  RETURN format('%s-%s-%s', v_prefix, p_academic_year, lpad(v_next_value::TEXT, 4, '0'));
END;
$$;

REVOKE ALL ON FUNCTION public.next_tuition_invoice_number(INTEGER, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.assign_tuition_invoice_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_due_day INTEGER;
  v_prefix TEXT;
  v_month INTEGER;
  v_last_day INTEGER;
BEGIN
  SELECT academic_year, payment_due_day, receipt_prefix
  INTO v_year, v_due_day, v_prefix
  FROM public.academic_settings
  WHERE singleton = TRUE;

  v_year := COALESCE(v_year, split_part(NEW.month_year, '-', 1)::INTEGER);
  v_due_day := COALESCE(v_due_day, 5);
  v_prefix := COALESCE(v_prefix, 'TBEC');
  v_month := split_part(NEW.month_year, '-', 2)::INTEGER;
  v_last_day := extract(day FROM (
    make_date(split_part(NEW.month_year, '-', 1)::INTEGER, v_month, 1)
    + interval '1 month - 1 day'
  ))::INTEGER;

  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := public.next_tuition_invoice_number(v_year, v_prefix);
  END IF;
  IF NEW.due_date IS NULL THEN
    NEW.due_date := make_date(
      split_part(NEW.month_year, '-', 1)::INTEGER,
      v_month,
      least(v_due_day, v_last_day)
    );
  END IF;

  IF NEW.status = 'paid' THEN
    NEW.paid_at := COALESCE(NEW.paid_at, timezone('utc'::text, now()));
    NEW.verified_at := COALESCE(NEW.verified_at, timezone('utc'::text, now()));
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_tuition_invoice_metadata_trigger ON public.monthly_tuition_fees;
CREATE TRIGGER assign_tuition_invoice_metadata_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_tuition_fees
  FOR EACH ROW EXECUTE FUNCTION public.assign_tuition_invoice_metadata();

UPDATE public.monthly_tuition_fees
SET
  invoice_number = COALESCE(
    invoice_number,
    public.next_tuition_invoice_number(
      COALESCE((SELECT academic_year FROM public.academic_settings WHERE singleton = TRUE), split_part(month_year, '-', 1)::INTEGER),
      COALESCE((SELECT receipt_prefix FROM public.academic_settings WHERE singleton = TRUE), 'TBEC')
    )
  ),
  due_date = COALESCE(due_date, make_date(
    split_part(month_year, '-', 1)::INTEGER,
    split_part(month_year, '-', 2)::INTEGER,
    least(
      COALESCE((SELECT payment_due_day FROM public.academic_settings WHERE singleton = TRUE), 5),
      extract(day FROM (
        make_date(split_part(month_year, '-', 1)::INTEGER, split_part(month_year, '-', 2)::INTEGER, 1)
        + interval '1 month - 1 day'
      ))::INTEGER
    )
  )),
  paid_at = CASE WHEN status = 'paid' THEN COALESCE(paid_at, created_at) ELSE paid_at END,
  verified_at = CASE WHEN status = 'paid' THEN COALESCE(verified_at, created_at) ELSE verified_at END;

ALTER TABLE public.monthly_tuition_fees
  ALTER COLUMN invoice_number SET NOT NULL,
  ALTER COLUMN due_date SET NOT NULL;
