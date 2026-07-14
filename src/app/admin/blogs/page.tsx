import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogList from '@/components/blogs/BlogList';

export const metadata = {
  title: 'Manage Blogs | Admin Panel',
};

export default async function AdminBlogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: blogs } = await supabase
    .from('blogs')
    .select(`
      *,
      profiles:author_id ( full_name )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
        <p className="mt-2 text-sm text-gray-600">Create and manage public blog posts.</p>
      </div>
      
      <BlogList 
        blogs={blogs || []} 
        roleBasePath="/admin/blogs" 
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
