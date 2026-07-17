ALTER TABLE public.monthly_tuition_fees
ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.monthly_tuition_fees
DROP CONSTRAINT IF EXISTS monthly_tuition_fees_amount_check;

ALTER TABLE public.monthly_tuition_fees
ADD CONSTRAINT monthly_tuition_fees_amount_check
CHECK (amount >= 0 AND amount <= 100000000);

ALTER TABLE public.monthly_tuition_fees
DROP CONSTRAINT IF EXISTS monthly_tuition_fees_status_check;

ALTER TABLE public.monthly_tuition_fees
ADD CONSTRAINT monthly_tuition_fees_status_check
CHECK (status IN ('paid', 'unpaid', 'scholar'));

CREATE INDEX IF NOT EXISTS monthly_tuition_fees_month_status_idx
ON public.monthly_tuition_fees (month_year, status);
