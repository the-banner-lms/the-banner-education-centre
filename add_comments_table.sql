-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
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
