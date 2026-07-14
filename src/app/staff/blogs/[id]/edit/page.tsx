import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import BlogForm from '@/components/blogs/BlogForm';
import { isStaff } from '@/utils/supabase/queries';

export const metadata = {
  title: 'Edit Blog | Staff Panel',
};

export default async function StaffEditBlogPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hasAccess = await isStaff(supabase);

  if (!hasAccess) {
    redirect('/dashboard');
  }

  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !blog) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog</h1>
        <p className="mt-2 text-sm text-gray-600">Update the existing public blog post.</p>
      </div>
      
      <BlogForm initialData={blog} roleBasePath="/staff/blogs" />
    </div>
  );
}
