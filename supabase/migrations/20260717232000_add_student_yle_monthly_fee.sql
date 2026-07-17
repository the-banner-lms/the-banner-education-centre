ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS yle_monthly_fee NUMERIC(12, 2);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_yle_monthly_fee_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_yle_monthly_fee_check
CHECK (yle_monthly_fee IS NULL OR (yle_monthly_fee BETWEEN 0 AND 100000000));

COMMENT ON COLUMN public.profiles.yle_monthly_fee IS
'Optional per-student YLE monthly fee override. NULL uses the assigned YLE section default fee.';
