import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

export const metadata = {
  title: 'Edit Announcement | Staff Panel',
};

export default async function StaffEditAnnouncementPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'staff') redirect('/dashboard');

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

  // Staff can only edit their own announcements
  if (announcement.author_id !== user.id) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
          You do not have permission to edit this announcement.
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
        roleBasePath="/staff/announcements" 
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
