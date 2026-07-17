ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS assigned_subclass TEXT;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_assigned_subclass_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_assigned_subclass_check
CHECK (
  assigned_subclass IS NULL OR assigned_subclass IN (
    'pre-starters',
    'starters',
    'movers',
    'flyers',
    'ket',
    'pet'
  )
);

CREATE INDEX IF NOT EXISTS profiles_yle_subclass_idx
ON public.profiles (assigned_subclass)
WHERE role = 'student' AND assigned_class = 'yle';
