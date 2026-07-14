import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogForm from '@/components/blogs/BlogForm';
import { isStaff } from '@/utils/supabase/queries';

export const metadata = {
  title: 'Create Blog | Staff Panel',
};

export default async function StaffNewBlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hasAccess = await isStaff(supabase);

  if (!hasAccess) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog</h1>
        <p className="mt-2 text-sm text-gray-600">Publish a new post to the public blog page.</p>
      </div>
      
      <BlogForm roleBasePath="/staff/blogs" />
    </div>
  );
}
