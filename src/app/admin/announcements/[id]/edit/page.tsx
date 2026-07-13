import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

export const metadata = {
  title: 'Edit Announcement | Admin Panel',
};

export default async function AdminEditAnnouncementPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: announcement } = await supabase.from('announcements').select('*').eq('id', params.id).single();

  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
          Announcement not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Announcement</h1>
      </div>
      
      <AnnouncementForm 
        roleBasePath="/admin/announcements" 
        initialData={{
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          target_role: announcement.target_role
        }}
      />
    </div>
  );
}
