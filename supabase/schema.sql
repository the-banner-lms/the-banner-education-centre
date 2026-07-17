-- Create tables for The Banner Education Centre

-- 1. Profiles (Extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  assigned_class TEXT CHECK (assigned_class IS NULL OR assigned_class IN ('pre-kg', 'kg', 'yle', 'primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6')),
  assigned_subclass TEXT CHECK (assigned_subclass IS NULL OR assigned_subclass IN ('pre-starters', 'starters', 'movers', 'flyers', 'ket', 'pet')),
  yle_monthly_fee NUMERIC(12, 2) CHECK (yle_monthly_fee IS NULL OR (yle_monthly_fee BETWEEN 0 AND 100000000)),
  address TEXT CHECK (address IS NULL OR char_length(address) <= 300),
  student_number TEXT UNIQUE,
  role TEXT DEFAULT 'student' CHECK (role IN ('super_admin', 'admin', 'editor', 'teacher', 'student', 'staff')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Public enrollment and monthly payment submissions. The table and private
-- storage bucket are accessed only through validated server actions.
CREATE TABLE public.enrollment_submissions (
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
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('kbzpay', 'wavepay', 'ayapay', 'bank_transfer', 'other')),
  payment_amount NUMERIC(12, 2) CHECK (payment_amount IS NULL OR (payment_amount > 0 AND payment_amount <= 100000000)),
  payment_date DATE,
  transaction_id TEXT,
  note TEXT,
  payment_slip_path TEXT NOT NULL,
  tracking_code TEXT NOT NULL DEFAULT lower(replace(gen_random_uuid()::TEXT, '-', '')),
  slip_sha256 TEXT,
  slip_perceptual_hash TEXT,
  slip_mime_type TEXT,
  slip_size_bytes BIGINT CHECK (slip_size_bytes IS NULL OR (slip_size_bytes > 0 AND slip_size_bytes <= 4194304)),
  slip_width INTEGER,
  slip_height INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (validation_status IN ('clear', 'needs_review', 'blocked')),
  validation_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  review_reason TEXT CHECK (review_reason IS NULL OR char_length(review_reason) <= 500),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notice_read_at TIMESTAMP WITH TIME ZONE,
  submitter_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, now())
);
ALTER TABLE public.enrollment_submissions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX enrollment_submissions_tracking_code_uidx ON public.enrollment_submissions (tracking_code);
CREATE UNIQUE INDEX enrollment_submissions_slip_sha256_uidx ON public.enrollment_submissions (slip_sha256) WHERE slip_sha256 IS NOT NULL;
CREATE UNIQUE INDEX enrollment_submissions_transaction_uidx ON public.enrollment_submissions (payment_method, payment_date, lower(transaction_id)) WHERE payment_method IS NOT NULL AND payment_date IS NOT NULL AND transaction_id IS NOT NULL;

-- 2. Bookshelf (Textbooks, Chapters, Lessons)
CREATE TABLE public.textbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  grade_level TEXT,
  pdf_url TEXT,
  storage_path TEXT,
  cover_storage_path TEXT,
  original_file_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  access_roles TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  textbook_id UUID REFERENCES public.textbooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Bookshelf (Public read, Admin write)
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read textbooks" ON public.textbooks FOR SELECT USING (true);
CREATE POLICY "Public read chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);

-- (In a real scenario, we'd add Admin-only write policies here, checking the profiles.role = 'admin')

-- 3. Announcements
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);

-- 4. Activities (Albums & Videos)
CREATE TABLE public.albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.album_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.activity_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Public read album_images" ON public.album_images FOR SELECT USING (true);
CREATE POLICY "Public read activity_videos" ON public.activity_videos FOR SELECT USING (true);

-- 5. Blog
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  cover_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published blog_posts" ON public.blog_posts FOR SELECT USING (published = true);

-- 6. Team Members
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_members" ON public.team_members FOR SELECT USING (true);

-- 7. Student Weekly Performances
CREATE TABLE public.weekly_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  burmese_score TEXT,
  english_score TEXT,
  math_score TEXT,
  science_score TEXT,
  sports_score TEXT,
  art_score TEXT,
  social_score TEXT,
  health_score TEXT,
  teamwork_score TEXT,
  discipline_score TEXT,
  remarks TEXT,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.weekly_performances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own performance" ON public.weekly_performances FOR SELECT USING (auth.uid() = student_id);
-- Staff/Admins will use the service role key or a specific policy to insert/update.
-- For simplicity, let's allow staff to view all performances:
CREATE POLICY "Staff can view all performances" ON public.weekly_performances FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

-- 8. Daily Attendance
DROP TABLE IF EXISTS public.daily_attendance CASCADE;

CREATE TABLE public.daily_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning_status TEXT NOT NULL CHECK (morning_status IN ('present', 'absent', 'leave')),
  afternoon_status TEXT NOT NULL CHECK (afternoon_status IN ('present', 'absent', 'leave')),
  remarks TEXT,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, date)
);

ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own attendance" ON public.daily_attendance FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Staff can view all attendance" ON public.daily_attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

-- 9. Monthly Tuition Fees
DROP TABLE IF EXISTS public.monthly_tuition_fees CASCADE;

CREATE TABLE public.monthly_tuition_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  status TEXT NOT NULL CHECK (status IN ('paid', 'unpaid', 'scholar')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0 AND amount <= 100000000),
  base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (base_amount BETWEEN 0 AND 100000000),
  yle_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (yle_amount BETWEEN 0 AND 100000000),
  remarks TEXT,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_submission_id UUID REFERENCES public.enrollment_submissions(id) ON DELETE SET NULL,
  email_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (email_status IN ('not_applicable', 'pending', 'sent', 'failed', 'not_configured')),
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, month_year)
);

CREATE UNIQUE INDEX monthly_tuition_fees_invoice_number_uidx ON public.monthly_tuition_fees (invoice_number);
CREATE UNIQUE INDEX monthly_tuition_fees_payment_submission_uidx ON public.monthly_tuition_fees (payment_submission_id) WHERE payment_submission_id IS NOT NULL;
CREATE INDEX monthly_tuition_fees_due_status_idx ON public.monthly_tuition_fees (due_date, status);

-- Setup Security Rules for Tuition Fees
ALTER TABLE public.monthly_tuition_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own tuition fees" ON public.monthly_tuition_fees FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Staff can manage tuition fees" ON public.monthly_tuition_fees FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

-- 9a. Academic year, class, section and fee settings
CREATE TABLE public.academic_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2000 AND 2100),
  current_term TEXT NOT NULL CHECK (char_length(current_term) BETWEEN 2 AND 40),
  payment_due_day SMALLINT NOT NULL DEFAULT 5 CHECK (payment_due_day BETWEEN 1 AND 28),
  receipt_prefix TEXT NOT NULL DEFAULT 'TBEC' CHECK (receipt_prefix ~ '^[A-Z0-9-]{2,16}$'),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2000 AND 2100),
  code TEXT NOT NULL CHECK (code ~ '^[a-z0-9-]{2,32}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee BETWEEN 0 AND 100000000),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX school_classes_year_code_uidx ON public.school_classes (academic_year, lower(code));

CREATE TABLE public.class_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee BETWEEN 0 AND 100000000),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX class_sections_class_name_uidx ON public.class_sections (class_id, lower(name));

INSERT INTO public.academic_settings (singleton, academic_year, current_term, payment_due_day, receipt_prefix)
VALUES (TRUE, 2026, '2nd Term', 5, 'TBEC');

INSERT INTO public.school_classes (academic_year, code, name, sort_order) VALUES
  (2026, 'pre-kg', 'Pre-KG', 10),
  (2026, 'kg', 'KG', 20),
  (2026, 'yle', 'YLE', 30),
  (2026, 'primary1', 'Primary 1', 40),
  (2026, 'primary2', 'Primary 2', 50),
  (2026, 'primary3', 'Primary 3', 60),
  (2026, 'primary4', 'Primary 4', 70),
  (2026, 'primary5', 'Primary 5', 80),
  (2026, 'primary6', 'Primary 6', 90);

INSERT INTO public.class_sections (class_id, name, sort_order)
SELECT school_class.id, section.name, section.sort_order
FROM public.school_classes AS school_class
CROSS JOIN (
  VALUES
    ('Pre-Starters', 10),
    ('Starters', 20),
    ('Movers', 30),
    ('Flyers', 40),
    ('KET', 50),
    ('PET', 60)
) AS section(name, sort_order)
WHERE lower(school_class.code) = 'yle';

ALTER TABLE public.academic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff manage academic settings" ON public.academic_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')));

CREATE POLICY "Admin and staff manage school classes" ON public.school_classes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')));

CREATE POLICY "Admin and staff manage class sections" ON public.class_sections FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')));

CREATE TABLE public.tuition_invoice_sequences (
  academic_year INTEGER CHECK (academic_year BETWEEN 2000 AND 2100),
  class_code TEXT NOT NULL,
  last_value BIGINT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (academic_year, class_code)
);
ALTER TABLE public.tuition_invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_tuition_invoice_number(p_academic_year INTEGER, p_prefix TEXT, p_class_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value BIGINT;
  v_prefix TEXT;
  v_class_code TEXT;
BEGIN
  IF p_academic_year < 2000 OR p_academic_year > 2100 THEN RAISE EXCEPTION 'Invalid academic year'; END IF;
  v_prefix := regexp_replace(upper(trim(p_prefix)), '[^A-Z0-9-]', '-', 'g');
  v_class_code := regexp_replace(upper(trim(p_class_code)), '[^A-Z0-9-]', '-', 'g');
  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN RAISE EXCEPTION 'Invalid invoice prefix'; END IF;
  IF char_length(v_class_code) < 2 OR char_length(v_class_code) > 32 THEN v_class_code := 'STUDENT'; END IF;
  INSERT INTO public.tuition_invoice_sequences (academic_year, class_code, last_value, updated_at)
  VALUES (p_academic_year, v_class_code, 1, timezone('utc'::text, now()))
  ON CONFLICT (academic_year, class_code) DO UPDATE
  SET last_value = public.tuition_invoice_sequences.last_value + 1,
      updated_at = timezone('utc'::text, now())
  RETURNING last_value INTO v_next_value;
  RETURN format('%s-%s-%s-%s', v_prefix, v_class_code, p_academic_year, lpad(v_next_value::TEXT, 4, '0'));
END;
$$;
REVOKE ALL ON FUNCTION public.next_tuition_invoice_number(INTEGER, TEXT, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.format_tuition_invoice_number(
  p_prefix TEXT,
  p_student_number TEXT,
  p_month_year TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_student_number TEXT;
  v_month_number TEXT;
  v_month_name TEXT;
BEGIN
  v_prefix := regexp_replace(upper(trim(COALESCE(p_prefix, 'TBEC'))), '[^A-Z0-9-]', '-', 'g');
  v_student_number := regexp_replace(upper(trim(COALESCE(p_student_number, 'STUDENT'))), '[^A-Z0-9-]', '-', 'g');
  v_month_number := split_part(COALESCE(p_month_year, ''), '-', 2);

  IF char_length(v_prefix) < 2 OR char_length(v_prefix) > 16 THEN
    v_prefix := 'TBEC';
  END IF;
  IF char_length(v_student_number) < 2 OR char_length(v_student_number) > 64 THEN
    v_student_number := 'STUDENT';
  END IF;
  IF COALESCE(p_month_year, '') !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid invoice month';
  END IF;

  v_month_name := to_char(
    make_date(split_part(p_month_year, '-', 1)::INTEGER, v_month_number::INTEGER, 1),
    'FMMonth'
  );

  RETURN format('%s-%s-%s', v_prefix, v_student_number, v_month_name);
END;
$$;
REVOKE ALL ON FUNCTION public.format_tuition_invoice_number(TEXT, TEXT, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.assign_tuition_invoice_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_due_day INTEGER;
  v_prefix TEXT;
  v_student_number TEXT;
  v_month INTEGER;
  v_last_day INTEGER;
BEGIN
  SELECT academic_year, payment_due_day, receipt_prefix INTO v_year, v_due_day, v_prefix
  FROM public.academic_settings WHERE singleton = TRUE;
  SELECT student_number INTO v_student_number FROM public.profiles WHERE id = NEW.student_id;
  v_year := COALESCE(v_year, split_part(NEW.month_year, '-', 1)::INTEGER);
  v_due_day := COALESCE(v_due_day, 5);
  v_prefix := COALESCE(v_prefix, 'TBEC');
  v_student_number := COALESCE(v_student_number, 'STUDENT-' || left(replace(NEW.student_id::TEXT, '-', ''), 8));
  v_month := split_part(NEW.month_year, '-', 2)::INTEGER;
  v_last_day := extract(day FROM (make_date(split_part(NEW.month_year, '-', 1)::INTEGER, v_month, 1) + interval '1 month - 1 day'))::INTEGER;
  NEW.invoice_number := public.format_tuition_invoice_number(v_prefix, v_student_number, NEW.month_year);
  IF NEW.due_date IS NULL THEN
    NEW.due_date := make_date(split_part(NEW.month_year, '-', 1)::INTEGER, v_month, least(v_due_day, v_last_day));
  END IF;
  IF NEW.status = 'paid' THEN
    NEW.paid_at := COALESCE(NEW.paid_at, timezone('utc'::text, now()));
    NEW.verified_at := COALESCE(NEW.verified_at, timezone('utc'::text, now()));
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_tuition_invoice_metadata_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_tuition_fees
  FOR EACH ROW EXECUTE FUNCTION public.assign_tuition_invoice_metadata();

-- 10. Direct Messages
CREATE TABLE public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Senders can see their sent messages
CREATE POLICY "Users can view their sent messages" ON public.direct_messages 
  FOR SELECT USING (auth.uid() = sender_id);

-- Receivers can see their received messages
CREATE POLICY "Users can view their received messages" ON public.direct_messages 
  FOR SELECT USING (auth.uid() = receiver_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all direct messages" ON public.direct_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can insert messages" ON public.direct_messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) messages they receive
CREATE POLICY "Users can update received messages" ON public.direct_messages 
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 11. Teacher Daily Reports
CREATE TABLE public.teacher_daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(teacher_id, date)
);

ALTER TABLE public.teacher_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own reports" ON public.teacher_daily_reports 
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own reports" ON public.teacher_daily_reports 
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Admins and Staff can view all teacher reports" ON public.teacher_daily_reports 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
    )
  );

-- Update daily_attendance policies to allow Teachers
CREATE POLICY "Teachers can manage all attendance" ON public.daily_attendance 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Also allow Staff/Admins to manage all attendance (since currently they only have SELECT)
CREATE POLICY "Staff can manage all attendance" ON public.daily_attendance 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
    )
  );
-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can read comments
CREATE POLICY "Public read blog_comments" 
  ON public.blog_comments 
  FOR SELECT 
  USING (true);

-- 2. Authenticated users can insert comments
CREATE POLICY "Users can insert comments" 
  ON public.blog_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
  ON public.blog_comments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Admins can delete any comment
CREATE POLICY "Admins can delete any comment" 
  ON public.blog_comments 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
