CREATE TABLE IF NOT EXISTS public.academic_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2000 AND 2100),
  current_term TEXT NOT NULL CHECK (char_length(current_term) BETWEEN 2 AND 40),
  payment_due_day SMALLINT NOT NULL DEFAULT 5 CHECK (payment_due_day BETWEEN 1 AND 28),
  receipt_prefix TEXT NOT NULL DEFAULT 'TBEC' CHECK (receipt_prefix ~ '^[A-Z0-9-]{2,16}$'),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.academic_settings (
  singleton,
  academic_year,
  current_term,
  payment_due_day,
  receipt_prefix
)
VALUES (TRUE, 2026, '2nd Term', 5, 'TBEC')
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2000 AND 2100),
  code TEXT NOT NULL CHECK (code ~ '^[a-z0-9-]{2,32}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee BETWEEN 0 AND 100000000),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS school_classes_year_code_uidx
ON public.school_classes (academic_year, lower(code));

CREATE INDEX IF NOT EXISTS school_classes_year_active_sort_idx
ON public.school_classes (academic_year, is_active, sort_order, name);

CREATE TABLE IF NOT EXISTS public.class_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS class_sections_class_name_uidx
ON public.class_sections (class_id, lower(name));

CREATE INDEX IF NOT EXISTS class_sections_class_active_sort_idx
ON public.class_sections (class_id, is_active, sort_order, name);

WITH seed_classes(code, name, sort_order) AS (
  VALUES
    ('pre-kg', 'Pre-KG', 10),
    ('kg', 'KG', 20),
    ('yle', 'YLE', 30),
    ('primary1', 'Primary 1', 40),
    ('primary2', 'Primary 2', 50),
    ('primary3', 'Primary 3', 60),
    ('primary4', 'Primary 4', 70),
    ('primary5', 'Primary 5', 80),
    ('primary6', 'Primary 6', 90)
)
INSERT INTO public.school_classes (academic_year, code, name, sort_order)
SELECT 2026, seed_classes.code, seed_classes.name, seed_classes.sort_order
FROM seed_classes
WHERE NOT EXISTS (
  SELECT 1
  FROM public.school_classes existing
  WHERE existing.academic_year = 2026
    AND lower(existing.code) = lower(seed_classes.code)
);

ALTER TABLE public.academic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and staff manage academic settings" ON public.academic_settings;
CREATE POLICY "Admin and staff manage academic settings"
ON public.academic_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin and staff manage school classes" ON public.school_classes;
CREATE POLICY "Admin and staff manage school classes"
ON public.school_classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin and staff manage class sections" ON public.class_sections;
CREATE POLICY "Admin and staff manage class sections"
ON public.class_sections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);
