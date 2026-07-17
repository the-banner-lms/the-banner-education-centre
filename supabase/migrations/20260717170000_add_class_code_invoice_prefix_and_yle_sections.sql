ALTER TABLE public.tuition_invoice_sequences
  ADD COLUMN IF NOT EXISTS class_code TEXT;

UPDATE public.tuition_invoice_sequences
SET class_code = 'LEGACY'
WHERE class_code IS NULL;

ALTER TABLE public.tuition_invoice_sequences
  ALTER COLUMN class_code SET NOT NULL;

ALTER TABLE public.tuition_invoice_sequences
  DROP CONSTRAINT IF EXISTS tuition_invoice_sequences_pkey;

ALTER TABLE public.tuition_invoice_sequences
  ADD CONSTRAINT tuition_invoice_sequences_pkey PRIMARY KEY (academic_year, class_code);

CREATE OR REPLACE FUNCTION public.next_tuition_invoice_number(
  p_academic_year INTEGER,
  p_prefix TEXT,
  p_class_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value BIGINT;
  v_prefix TEXT;
  v_class_code TEXT;
BEGIN
  IF p_academic_year < 2000 OR p_academic_year > 2100 THEN
    RAISE EXCEPTION 'Invalid academic year';
  END IF;

  v_prefix := regexp_replace(upper(trim(p_prefix)), '[^A-Z0-9-]', '-', 'g');
  v_class_code := regexp_replace(upper(trim(p_class_code)), '[^A-Z0-9-]', '-', 'g');
  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN
    RAISE EXCEPTION 'Invalid invoice prefix';
  END IF;
  IF char_length(v_class_code) < 2 OR char_length(v_class_code) > 32 THEN
    v_class_code := 'STUDENT';
  END IF;

  INSERT INTO public.tuition_invoice_sequences (academic_year, class_code, last_value, updated_at)
  VALUES (p_academic_year, v_class_code, 1, timezone('utc'::text, now()))
  ON CONFLICT (academic_year, class_code) DO UPDATE
  SET last_value = public.tuition_invoice_sequences.last_value + 1,
      updated_at = timezone('utc'::text, now())
  RETURNING last_value INTO v_next_value;

  RETURN format('%s-%s-%s-%s', v_prefix, v_class_code, p_academic_year, lpad(v_next_value::TEXT, 4, '0'));
END;
$$;

REVOKE ALL ON FUNCTION public.next_tuition_invoice_number(INTEGER, TEXT, TEXT) FROM PUBLIC;

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
  v_class_code TEXT;
  v_month INTEGER;
  v_last_day INTEGER;
BEGIN
  SELECT academic_year, payment_due_day, receipt_prefix
  INTO v_year, v_due_day, v_prefix
  FROM public.academic_settings
  WHERE singleton = TRUE;

  SELECT assigned_class
  INTO v_class_code
  FROM public.profiles
  WHERE id = NEW.student_id;

  v_year := COALESCE(v_year, split_part(NEW.month_year, '-', 1)::INTEGER);
  v_due_day := COALESCE(v_due_day, 5);
  v_prefix := COALESCE(v_prefix, 'TBEC');
  v_class_code := COALESCE(v_class_code, 'STUDENT');
  v_month := split_part(NEW.month_year, '-', 2)::INTEGER;
  v_last_day := extract(day FROM (
    make_date(split_part(NEW.month_year, '-', 1)::INTEGER, v_month, 1)
    + interval '1 month - 1 day'
  ))::INTEGER;

  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := public.next_tuition_invoice_number(v_year, v_prefix, v_class_code);
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

DELETE FROM public.tuition_invoice_sequences;

UPDATE public.monthly_tuition_fees
SET invoice_number = NULL;

DROP FUNCTION IF EXISTS public.next_tuition_invoice_number(INTEGER, TEXT);

INSERT INTO public.class_sections (class_id, name, sort_order)
SELECT school_class.id, section.name, section.sort_order
FROM public.school_classes AS school_class
CROSS JOIN (
  VALUES
    ('Pre-Starters', 10),
    ('Starters', 20),
    ('Movers', 30),
    ('Flyers', 40),
    ('KET', 50),
    ('PET', 60)
) AS section(name, sort_order)
WHERE lower(school_class.code) = 'yle'
ON CONFLICT DO NOTHING;
