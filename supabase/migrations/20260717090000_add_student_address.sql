ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_address_length_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_address_length_check
CHECK (address IS NULL OR char_length(address) <= 300);
