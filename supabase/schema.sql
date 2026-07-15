-- Create tables for The Banner Education Centre

-- 1. Profiles (Extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
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
  status TEXT NOT NULL CHECK (status IN ('paid', 'unpaid')),
  remarks TEXT,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, month_year)
);

-- Setup Security Rules for Tuition Fees
ALTER TABLE public.monthly_tuition_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own tuition fees" ON public.monthly_tuition_fees FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Staff can manage tuition fees" ON public.monthly_tuition_fees FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')
  )
);

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
