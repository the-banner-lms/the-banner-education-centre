ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS student_number TEXT;

CREATE TABLE IF NOT EXISTS public.student_id_counters (
  class_code TEXT NOT NULL,
  registration_year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  PRIMARY KEY (class_code, registration_year)
);

ALTER TABLE public.student_id_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_student_number(p_class_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_code TEXT := lower(trim(p_class_code));
  v_year INTEGER := extract(year from timezone('Asia/Yangon', now()))::INTEGER;
  v_number INTEGER;
BEGIN
  IF v_class_code NOT IN (
    'pre-kg', 'kg', 'yle', 'primary1', 'primary2', 'primary3',
    'primary4', 'primary5', 'primary6'
  ) THEN
    RAISE EXCEPTION 'Invalid student class';
  END IF;

  INSERT INTO public.student_id_counters (class_code, registration_year, last_number)
  VALUES (v_class_code, v_year, 1)
  ON CONFLICT (class_code, registration_year)
  DO UPDATE SET last_number = public.student_id_counters.last_number + 1
  RETURNING last_number INTO v_number;

  RETURN v_class_code || '-' || v_year || '-' ||
    lpad(v_number::TEXT, greatest(3, length(v_number::TEXT)), '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_student_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_student_number(TEXT) TO service_role;

WITH ranked_students AS (
  SELECT
    id,
    lower(assigned_class) AS class_code,
    extract(year from created_at)::INTEGER AS registration_year,
    row_number() OVER (
      PARTITION BY lower(assigned_class), extract(year from created_at)::INTEGER
      ORDER BY created_at, id
    ) AS sequence_number
  FROM public.profiles
  WHERE role = 'student'
    AND assigned_class IS NOT NULL
    AND student_number IS NULL
)
UPDATE public.profiles AS profile
SET student_number = ranked.class_code || '-' || ranked.registration_year || '-' ||
  lpad(
    ranked.sequence_number::TEXT,
    greatest(3, length(ranked.sequence_number::TEXT)),
    '0'
  )
FROM ranked_students AS ranked
WHERE profile.id = ranked.id;

INSERT INTO public.student_id_counters (class_code, registration_year, last_number)
SELECT
  lower(assigned_class),
  extract(year from created_at)::INTEGER,
  count(*)::INTEGER
FROM public.profiles
WHERE role = 'student'
  AND assigned_class IS NOT NULL
  AND student_number IS NOT NULL
GROUP BY lower(assigned_class), extract(year from created_at)::INTEGER
ON CONFLICT (class_code, registration_year)
DO UPDATE SET last_number = greatest(
  public.student_id_counters.last_number,
  excluded.last_number
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_number_unique_idx
ON public.profiles (student_number)
WHERE student_number IS NOT NULL;
