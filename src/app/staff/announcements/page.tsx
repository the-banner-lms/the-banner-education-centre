import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementList from '@/components/announcements/AnnouncementList';

export const metadata = {
  title: 'Manage Announcements | Staff Panel',
};

export default async function StaffAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profile?.role !== 'staff') {
    redirect('/dashboard');
  }

  // Fetch announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-sm text-gray-600">Create and manage your announcements.</p>
      </div>
      
      <AnnouncementList 
        announcements={announcements || []} 
        roleBasePath="/staff/announcements" 
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
