const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('RecentAnnouncementsInbox')) {
  content = content.replace("import PDFDownloadButton", "import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'\nimport PDFDownloadButton");
}

// 2. Fetch recent announcements
const fetchLogic = `  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role,
      target_role
    \`)
    .in('target_role', ['all', profile.role])
    .order('created_at', { ascending: false })
    .limit(5);

  const currentPerformances =`;

if (!content.includes('const { data: recentAnnouncements }')) {
  content = content.replace('  const currentPerformances =', fetchLogic);
}

// 3. Add the component
// Put it right after the profile header block
const componentJSX = `        </div>
      </div>

      {user.id === studentId && (
        <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />
      )}`;

if (!content.includes('<RecentAnnouncementsInbox')) {
  content = content.replace('        </div>\n      </div>', componentJSX);
}

fs.writeFileSync('src/app/dashboard/[id]/page.tsx', content);
console.log('Fixed dashboard/[id]/page.tsx');
