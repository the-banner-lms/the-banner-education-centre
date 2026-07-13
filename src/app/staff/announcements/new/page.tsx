import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

export const metadata = {
  title: 'Create Announcement | Staff Panel',
};

export default async function StaffNewAnnouncementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'staff') redirect('/dashboard');

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Announcement</h1>
        <p className="mt-2 text-sm text-gray-600">This announcement will be visible to targeted site members.</p>
      </div>
      
      <AnnouncementForm roleBasePath="/staff/announcements" />
    </div>
  );
}
