ALTER TABLE public.monthly_tuition_fees
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS yle_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.monthly_tuition_fees
DROP CONSTRAINT IF EXISTS monthly_tuition_fees_base_amount_check;

ALTER TABLE public.monthly_tuition_fees
ADD CONSTRAINT monthly_tuition_fees_base_amount_check
CHECK (base_amount BETWEEN 0 AND 100000000);

ALTER TABLE public.monthly_tuition_fees
DROP CONSTRAINT IF EXISTS monthly_tuition_fees_yle_amount_check;

ALTER TABLE public.monthly_tuition_fees
ADD CONSTRAINT monthly_tuition_fees_yle_amount_check
CHECK (yle_amount BETWEEN 0 AND 100000000);

UPDATE public.monthly_tuition_fees AS fee
SET
  yle_amount = CASE
    WHEN profile.assigned_subclass IS NOT NULL AND profile.yle_monthly_fee IS NOT NULL
      THEN least(fee.amount, profile.yle_monthly_fee)
    ELSE 0
  END,
  base_amount = fee.amount - CASE
    WHEN profile.assigned_subclass IS NOT NULL AND profile.yle_monthly_fee IS NOT NULL
      THEN least(fee.amount, profile.yle_monthly_fee)
    ELSE 0
  END
FROM public.profiles AS profile
WHERE profile.id = fee.student_id;

COMMENT ON COLUMN public.monthly_tuition_fees.base_amount IS
'Base class portion captured when the invoice is created or updated.';

COMMENT ON COLUMN public.monthly_tuition_fees.yle_amount IS
'YLE dual-class portion captured when the invoice is created or updated.';
