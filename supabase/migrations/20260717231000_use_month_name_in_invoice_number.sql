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
  v_month_number TEXT;
  v_month_name TEXT;
BEGIN
  v_prefix := regexp_replace(upper(trim(COALESCE(p_prefix, 'TBEC'))), '[^A-Z0-9-]', '-', 'g');
  v_student_number := regexp_replace(upper(trim(COALESCE(p_student_number, 'STUDENT'))), '[^A-Z0-9-]', '-', 'g');
  v_month_number := split_part(COALESCE(p_month_year, ''), '-', 2);

  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN
    v_prefix := 'TBEC';
  END IF;
  IF char_length(v_student_number) < 2 OR char_length(v_student_number) > 64 THEN
    v_student_number := 'STUDENT';
  END IF;
  IF COALESCE(p_month_year, '') !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid invoice month';
  END IF;

  v_month_name := to_char(
    make_date(split_part(p_month_year, '-', 1)::INTEGER, v_month_number::INTEGER, 1),
    'FMMonth'
  );

  RETURN format('%s-%s-%s', v_prefix, v_student_number, v_month_name);
END;
$$;

REVOKE ALL ON FUNCTION public.format_tuition_invoice_number(TEXT, TEXT, TEXT) FROM PUBLIC;

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
