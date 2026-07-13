import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementList from '@/components/announcements/AnnouncementList';

export const metadata = {
  title: 'Manage Announcements | Admin Panel',
};

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { getAllAnnouncements } = await import('@/utils/supabase/announcements');
  const announcements = await getAllAnnouncements(supabase);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-sm text-gray-600">Create and manage site-wide announcements.</p>
      </div>
      
      <AnnouncementList 
        announcements={announcements || []} 
        roleBasePath="/admin/announcements" 
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
