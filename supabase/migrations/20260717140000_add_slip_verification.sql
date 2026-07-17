ALTER TABLE public.enrollment_submissions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS slip_sha256 TEXT,
ADD COLUMN IF NOT EXISTS slip_perceptual_hash TEXT,
ADD COLUMN IF NOT EXISTS slip_mime_type TEXT,
ADD COLUMN IF NOT EXISTS slip_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS slip_width INTEGER,
ADD COLUMN IF NOT EXISTS slip_height INTEGER,
ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'needs_review',
ADD COLUMN IF NOT EXISTS validation_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS review_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notice_read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitter_fingerprint TEXT;

UPDATE public.enrollment_submissions
SET tracking_code = lower(replace(gen_random_uuid()::TEXT, '-', ''))
WHERE tracking_code IS NULL;

ALTER TABLE public.enrollment_submissions
ALTER COLUMN tracking_code SET DEFAULT lower(replace(gen_random_uuid()::TEXT, '-', '')),
ALTER COLUMN tracking_code SET NOT NULL;

ALTER TABLE public.enrollment_submissions
DROP CONSTRAINT IF EXISTS enrollment_submissions_payment_method_check,
ADD CONSTRAINT enrollment_submissions_payment_method_check CHECK (
  payment_method IS NULL OR payment_method IN ('kbzpay', 'wavepay', 'ayapay', 'bank_transfer', 'other')
),
DROP CONSTRAINT IF EXISTS enrollment_submissions_payment_amount_check,
ADD CONSTRAINT enrollment_submissions_payment_amount_check CHECK (
  payment_amount IS NULL OR (payment_amount > 0 AND payment_amount <= 100000000)
),
DROP CONSTRAINT IF EXISTS enrollment_submissions_validation_status_check,
ADD CONSTRAINT enrollment_submissions_validation_status_check CHECK (
  validation_status IN ('clear', 'needs_review', 'blocked')
),
DROP CONSTRAINT IF EXISTS enrollment_submissions_review_reason_check,
ADD CONSTRAINT enrollment_submissions_review_reason_check CHECK (
  review_reason IS NULL OR char_length(review_reason) <= 500
),
DROP CONSTRAINT IF EXISTS enrollment_submissions_slip_size_check,
ADD CONSTRAINT enrollment_submissions_slip_size_check CHECK (
  slip_size_bytes IS NULL OR (slip_size_bytes > 0 AND slip_size_bytes <= 4194304)
);

CREATE UNIQUE INDEX IF NOT EXISTS enrollment_submissions_tracking_code_uidx
ON public.enrollment_submissions (tracking_code);

CREATE UNIQUE INDEX IF NOT EXISTS enrollment_submissions_slip_sha256_uidx
ON public.enrollment_submissions (slip_sha256)
WHERE slip_sha256 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS enrollment_submissions_transaction_uidx
ON public.enrollment_submissions (payment_method, lower(transaction_id))
WHERE payment_method IS NOT NULL AND transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS enrollment_submissions_fingerprint_created_idx
ON public.enrollment_submissions (submitter_fingerprint, created_at DESC)
WHERE submitter_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS enrollment_submissions_email_tracking_idx
ON public.enrollment_submissions (lower(email), tracking_code);
