CREATE TABLE IF NOT EXISTS public.enrollment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type TEXT NOT NULL CHECK (submission_type IN ('new_enrollment', 'monthly_payment')),
  assigned_class TEXT NOT NULL CHECK (assigned_class IN ('pre-kg', 'kg', 'yle', 'primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6')),
  assigned_subclass TEXT CHECK (assigned_subclass IS NULL OR assigned_subclass IN ('pre-starters', 'starters', 'movers', 'flyers', 'ket', 'pet')),
  student_name TEXT NOT NULL CHECK (char_length(student_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  viber_number TEXT,
  address TEXT,
  student_number TEXT,
  payment_month TEXT,
  note TEXT,
  payment_slip_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.enrollment_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS enrollment_submissions_created_at_idx
ON public.enrollment_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS enrollment_submissions_status_idx
ON public.enrollment_submissions (status, submission_type);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment-slips',
  'enrollment-slips',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
