const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Add import
if (!content.includes('RecentAnnouncementsInbox')) {
  content = content.replace("import PDFDownloadButton", "import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'\nimport PDFDownloadButton");
}

// Replace the announcements block
const oldBlock = `{recentAnnouncements && recentAnnouncements.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-8 hide-in-pdf">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-orange-900">Recent Announcements</h2>
            <a href="/announcements" className="text-sm font-medium text-orange-600 hover:text-orange-800">View All</a>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAnnouncements.map((announcement: any) => (
              <a key={announcement.id} href={\`/announcements/\${announcement.id}\`} className="block hover:bg-orange-50 transition-colors p-4 px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold text-gray-900">{announcement.title}</h3>
                  <span className="text-xs text-gray-500">{new Date(announcement.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <span className="font-medium">By: {""} {""}</span>
                  <span className="mx-2">•</span>
                  <span className="uppercase text-xs tracking-wider bg-gray-100 px-2 py-0.5 rounded">{announcement.author_role}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}`;

const newBlock = `<RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
} else {
  // Try regex if exact string mismatch
  content = content.replace(/\{recentAnnouncements && recentAnnouncements\.length > 0 && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*\)\}/, newBlock);
}

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Done dashboard');
