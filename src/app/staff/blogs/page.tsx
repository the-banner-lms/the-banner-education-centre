import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogList from '@/components/blogs/BlogList';
import { isStaff } from '@/utils/supabase/queries';

export const metadata = {
  title: 'Manage Blogs | Staff Panel',
};

export default async function StaffBlogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const hasAccess = await isStaff(supabase);

  if (!hasAccess) {
    redirect('/dashboard');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

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
        roleBasePath="/staff/blogs" 
        currentUserId={user.id}
        currentUserRole={profile?.role || 'staff'}
      />
    </div>
  );
}
