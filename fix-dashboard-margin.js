const fs = require('fs');

// Fix src/app/dashboard/page.tsx
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

content = content.replace(
  '<RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />',
  '<div className="mb-8">\n        <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />\n      </div>'
);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log("Fixed dashboard margin");
