import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReplySection from '@/components/announcements/ReplySection';

export const metadata = {
  title: 'Announcement Details | The Banner Education Centre',
};

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (!profile) redirect('/login');

  const { getAnnouncementById } = await import('@/utils/supabase/announcements');
  const announcement = await getAnnouncementById(supabase, id);

  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
          Announcement not found or has been removed.
        </div>
        <div className="mt-4 text-center">
          <Link href="/announcements" className="text-indigo-600 hover:text-indigo-800 font-medium">
            &larr; Back to Announcements
          </Link>
        </div>
      </div>
    );
  }

  const isIntendedRecipient = !announcement.target_role
    || announcement.target_role === 'all'
    || profile.role === announcement.target_role;
  const canManageAnnouncement = profile.role === 'admin' || announcement.author_id === user.id;

  if (!isIntendedRecipient && !canManageAnnouncement) {
    return (
       <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
          You do not have permission to view this announcement.
        </div>
        <div className="mt-4 text-center">
          <Link href="/announcements" className="text-indigo-600 hover:text-indigo-800 font-medium">
            &larr; Back to Announcements
          </Link>
        </div>
      </div>
    );
  }

  // Fetch replies
  const { data: repliesData } = await supabase
    .from('announcement_replies')
    .select(`
      id,
      content,
      created_at,
      user_id
    `)
    .eq('announcement_id', id)
    .order('created_at', { ascending: true });

  const replies = repliesData || [];
  
  // Fetch profiles separately
  const userIds = replies.map(r => r.user_id);
  const profilesMap: Record<string, { first_name: string; last_name: string }> = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('id', userIds);
      
    if (profilesData) {
      profilesData.forEach(p => {
        profilesMap[p.id] = {
          first_name: p.first_name || '',
          last_name: p.last_name || '',
        };
      });
    }
  }

  // Attach profiles to replies
  const enrichedReplies = replies.map(r => ({
    ...r,
    profiles: profilesMap[r.user_id] || { first_name: 'Unknown', last_name: 'User' }
  }));

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/announcements" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
          &larr; Back to Announcements
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{announcement.title}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6 gap-4">
            <span>
              Posted by <span className="capitalize">{announcement.author_role || "Admin"}</span>
            </span>
            <span>&bull;</span>
            <span>
              {new Date(announcement.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {announcement.target_role && announcement.target_role !== 'all' && (
              <>
                 <span>&bull;</span>
                 <span className="capitalize px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                   {announcement.target_role}s Only
                 </span>
              </>
            )}
          </div>
          
          <div 
            className="prose max-w-none mb-12 text-gray-800"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          <ReplySection 
            announcementId={announcement.id}
            initialReplies={enrichedReplies}
            currentUserId={user.id}
            currentUserRole={profile.role}
          />
        </div>
      </div>
    </div>
  );
}
