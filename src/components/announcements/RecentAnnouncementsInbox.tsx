import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  created_at: string;
  author_role?: string | null;
  target_role?: string | null;
}

export default function RecentAnnouncementsInbox({ announcements, viewAllHref = "/announcements" }: { announcements: Announcement[], viewAllHref?: string }) {
  const announcementCount = announcements?.length || 0;

  return (
    <details className="group bg-white rounded-lg shadow border border-gray-200 mb-8 overflow-hidden hide-in-pdf">
      <summary className="list-none cursor-pointer bg-gray-50 px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-100 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="text-base font-bold text-gray-800 flex items-center min-w-0">
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Inbox (Announcements)
        </span>
        <span className="flex items-center gap-3 flex-shrink-0">
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {announcementCount}
          </span>
          <svg className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>

      <div className="border-t border-gray-200">
        <div className="bg-white px-4 py-2 flex justify-end">
          <Link href={viewAllHref} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        </div>

        {announcementCount === 0 ? (
          <div className="border-t border-gray-100 p-8 text-center text-gray-500 text-sm">
            No new announcements.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {announcements.map((announcement, index) => {
              // Highlight the newest item to look like an unread email.
              const isUnread = index === 0;
              return (
                <Link key={announcement.id} href={`/announcements/${announcement.id}`} className={`group/item flex items-center px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-indigo-50/30' : 'bg-white'}`}>
                  <div className="hidden sm:flex flex-shrink-0 mr-4 text-gray-300 group-hover/item:text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>

                  <div className="w-24 sm:w-32 flex-shrink-0 pr-2">
                    <span className={`text-sm truncate block capitalize ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {announcement.author_role || 'Admin'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block sm:hidden">
                      To: {announcement.target_role || 'All'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center">
                      {isUnread && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 mr-2"></span>
                      )}
                      <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'text-gray-800'}`}>
                        {announcement.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 truncate hidden sm:block mt-0.5">
                      Click to view full details and responses...
                    </span>
                  </div>

                  <div className="flex-shrink-0 text-right w-16 sm:w-24">
                    <span className={`text-xs ${isUnread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      {new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}
