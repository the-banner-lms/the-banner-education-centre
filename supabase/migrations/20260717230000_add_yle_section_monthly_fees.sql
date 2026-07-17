ALTER TABLE public.class_sections
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.class_sections
DROP CONSTRAINT IF EXISTS class_sections_monthly_fee_check;

ALTER TABLE public.class_sections
ADD CONSTRAINT class_sections_monthly_fee_check
CHECK (monthly_fee BETWEEN 0 AND 100000000);

COMMENT ON COLUMN public.class_sections.monthly_fee IS
'Separate monthly tuition fee for the section. YLE sections are optional dual programmes for every class except Pre-KG.';
