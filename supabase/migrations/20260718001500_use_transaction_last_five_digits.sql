DROP INDEX IF EXISTS public.enrollment_submissions_transaction_uidx;

CREATE UNIQUE INDEX enrollment_submissions_transaction_uidx
ON public.enrollment_submissions (payment_method, payment_date, lower(transaction_id))
WHERE payment_method IS NOT NULL
  AND payment_date IS NOT NULL
  AND transaction_id IS NOT NULL;

COMMENT ON COLUMN public.enrollment_submissions.transaction_id IS
'The final five digits of the payment transaction ID for new submissions. Older records may contain the full ID.';
