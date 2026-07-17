CREATE OR REPLACE FUNCTION public.format_tuition_invoice_number(
  p_prefix TEXT,
  p_student_number TEXT,
  p_month_year TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_student_number TEXT;
  v_month TEXT;
BEGIN
  v_prefix := regexp_replace(upper(trim(COALESCE(p_prefix, 'TBEC'))), '[^A-Z0-9-]', '-', 'g');
  v_student_number := regexp_replace(upper(trim(COALESCE(p_student_number, 'STUDENT'))), '[^A-Z0-9-]', '-', 'g');
  v_month := split_part(COALESCE(p_month_year, ''), '-', 2);

  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN
    v_prefix := 'TBEC';
  END IF;
  IF char_length(v_student_number) < 2 OR char_length(v_student_number) > 64 THEN
    v_student_number := 'STUDENT';
  END IF;
  IF v_month !~ '^(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid invoice month';
  END IF;

  RETURN format('%s-%s-%s', v_prefix, v_student_number, v_month);
END;
$$;

REVOKE ALL ON FUNCTION public.format_tuition_invoice_number(TEXT, TEXT, TEXT) FROM PUBLIC;

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
  v_student_number TEXT;
  v_month INTEGER;
  v_last_day INTEGER;
BEGIN
  SELECT academic_year, payment_due_day, receipt_prefix
  INTO v_year, v_due_day, v_prefix
  FROM public.academic_settings
  WHERE singleton = TRUE;

  SELECT student_number
  INTO v_student_number
  FROM public.profiles
  WHERE id = NEW.student_id;

  v_year := COALESCE(v_year, split_part(NEW.month_year, '-', 1)::INTEGER);
  v_due_day := COALESCE(v_due_day, 5);
  v_prefix := COALESCE(v_prefix, 'TBEC');
  v_student_number := COALESCE(
    v_student_number,
    'STUDENT-' || left(replace(NEW.student_id::TEXT, '-', ''), 8)
  );
  v_month := split_part(NEW.month_year, '-', 2)::INTEGER;
  v_last_day := extract(day FROM (
    make_date(split_part(NEW.month_year, '-', 1)::INTEGER, v_month, 1)
    + interval '1 month - 1 day'
  ))::INTEGER;

  NEW.invoice_number := public.format_tuition_invoice_number(
    v_prefix,
    v_student_number,
    NEW.month_year
  );

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

UPDATE public.monthly_tuition_fees AS fee
SET invoice_number = public.format_tuition_invoice_number(
  COALESCE(settings.receipt_prefix, 'TBEC'),
  COALESCE(
    profile.student_number,
    'STUDENT-' || left(replace(fee.student_id::TEXT, '-', ''), 8)
  ),
  fee.month_year
)
FROM public.profiles AS profile
LEFT JOIN public.academic_settings AS settings ON settings.singleton = TRUE
WHERE profile.id = fee.student_id;
