import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import BlogForm from '@/components/blogs/BlogForm';

export const metadata = {
  title: 'Edit Post | Admin Panel',
};

export default async function AdminEditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !blog) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        <p className="mt-2 text-sm text-gray-600">Update the existing public blog post.</p>
      </div>
      
      <BlogForm initialData={blog} roleBasePath="/admin/blogs" />
    </div>
  );
}
