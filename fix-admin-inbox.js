const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

// The issue is that user.id === studentId is hiding the inbox when the admin views the student's dashboard.
// Since the inbox shows announcements for the target profile (the student in this case),
// we probably only want the student themselves to see their *own* inbox here, OR maybe the admin should see it too.
// Let's just remove the condition entirely so the inbox always shows on this page for now, 
// OR keep it but allow admins to see it.
// Actually, the previous version had NO condition on the inbox before I broke it.
// Wait, the previous version just rendered <RecentAnnouncementsInbox ... />

content = content.replace(
  '      {user.id === studentId && (\n        <div className="mb-8">\n          <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />\n        </div>\n      )}',
  '      <div className="mb-8">\n        <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />\n      </div>'
);

fs.writeFileSync('src/app/dashboard/[id]/page.tsx', content);
console.log("Removed user.id === studentId condition");
