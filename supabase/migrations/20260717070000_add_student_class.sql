ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS assigned_class TEXT;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_assigned_class_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_assigned_class_check
CHECK (
  assigned_class IS NULL OR assigned_class IN (
    'pre-kg',
    'kg',
    'yle',
    'primary1',
    'primary2',
    'primary3',
    'primary4',
    'primary5',
    'primary6'
  )
);

CREATE INDEX IF NOT EXISTS profiles_student_class_idx
ON public.profiles (assigned_class)
WHERE role = 'student';
