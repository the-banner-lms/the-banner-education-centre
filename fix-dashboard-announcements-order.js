const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

// Move the inbox ABOVE the profile banner section.
// Removing it from where it is now:
content = content.replace(
  '      {user.id === studentId && (\n        <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />\n      )}\n\n      {isStudent && (',
  '      {isStudent && ('
);

// Putting it before the profile banner
const newLocation = `      {user.id === studentId && (
        <div className="mb-8">
          <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mb-8 relative">`;

content = content.replace(
  '      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mb-8 relative">',
  newLocation
);

fs.writeFileSync('src/app/dashboard/[id]/page.tsx', content);
console.log('Fixed announcement location');
