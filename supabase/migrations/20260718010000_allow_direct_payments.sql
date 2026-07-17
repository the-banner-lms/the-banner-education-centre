ALTER TABLE public.enrollment_submissions
DROP CONSTRAINT IF EXISTS enrollment_submissions_payment_method_check,
ADD CONSTRAINT enrollment_submissions_payment_method_check CHECK (
  payment_method IS NULL OR payment_method IN ('direct', 'kbzpay', 'wavepay', 'ayapay', 'bank_transfer')
),
ALTER COLUMN payment_slip_path DROP NOT NULL;

COMMENT ON COLUMN public.enrollment_submissions.payment_slip_path IS
  'Private storage path for online payment slips; NULL for direct/in-person payments.';
