ALTER TABLE public.enrollment_submissions
ADD COLUMN IF NOT EXISTS student_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS enrollment_submissions_student_profile_idx
ON public.enrollment_submissions (student_profile_id)
WHERE student_profile_id IS NOT NULL;

COMMENT ON COLUMN public.enrollment_submissions.student_profile_id IS
  'Student profile automatically created or linked when a new enrollment is approved.';
