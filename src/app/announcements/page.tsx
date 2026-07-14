import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Announcements | The Banner Education Centre',
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (!profile) redirect('/login');

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  const announcements = await getRecentAnnouncementsForRole(supabase, profile.role, 50);

  // Fetch read records for this user
  const { data: readRecords } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', user.id);
    
  const readIds = new Set(readRecords?.map(r => r.announcement_id) || []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-gray-600">Stay up to date with the latest news and updates.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {announcements && announcements.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {announcements.map((announcement) => {
              const isUnread = !readIds.has(announcement.id);
              return (
                <li key={announcement.id} className={`hover:bg-gray-50 transition-colors ${isUnread ? 'bg-indigo-50/30' : ''}`}>
                  <Link href={`/announcements/${announcement.id}`} className="block px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className={`text-lg font-medium truncate ${isUnread ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {announcement.title}
                          </h2>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              New
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 gap-4">
                          <span>
                            Posted by <span className="capitalize">{announcement.author_role || "Admin"}</span>
                          </span>
                          <span>&bull;</span>
                          <span>
                            {new Date(announcement.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No announcements available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
