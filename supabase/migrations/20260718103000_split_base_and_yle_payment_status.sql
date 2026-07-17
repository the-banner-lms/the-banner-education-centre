ALTER TABLE public.monthly_tuition_fees
  ADD COLUMN IF NOT EXISTS base_status TEXT,
  ADD COLUMN IF NOT EXISTS yle_status TEXT;

ALTER TABLE public.monthly_tuition_fees
  DROP CONSTRAINT IF EXISTS monthly_tuition_fees_base_status_check,
  DROP CONSTRAINT IF EXISTS monthly_tuition_fees_yle_status_check;

ALTER TABLE public.monthly_tuition_fees
  ADD CONSTRAINT monthly_tuition_fees_base_status_check
    CHECK (base_status IS NULL OR base_status IN ('paid', 'unpaid', 'scholar')),
  ADD CONSTRAINT monthly_tuition_fees_yle_status_check
    CHECK (yle_status IS NULL OR yle_status IN ('paid', 'unpaid', 'scholar'));

UPDATE public.monthly_tuition_fees
SET
  base_status = CASE WHEN base_amount > 0 THEN status ELSE NULL END,
  yle_status = CASE WHEN yle_amount > 0 THEN status ELSE NULL END
WHERE base_status IS NULL AND yle_status IS NULL;

COMMENT ON COLUMN public.monthly_tuition_fees.base_status IS
'Independent payment status for the student base-class tuition component.';

COMMENT ON COLUMN public.monthly_tuition_fees.yle_status IS
'Independent payment status for the YLE standalone or dual tuition component.';
