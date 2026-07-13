const fs = require('fs');

// Teacher Dashboard
let teacherContent = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');
if (!teacherContent.includes('RecentAnnouncementsInbox')) {
  teacherContent = teacherContent.replace("import { createClient }", "import { createClient }\nimport RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'");
}
teacherContent = teacherContent.replace(/\{recentAnnouncements && recentAnnouncements\.length > 0 && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*\)\}/, '<RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />');
fs.writeFileSync('src/app/teacher/page.tsx', teacherContent);

// Staff Dashboard
let staffContent = fs.readFileSync('src/app/staff/page.tsx', 'utf8');
if (!staffContent.includes('RecentAnnouncementsInbox')) {
  staffContent = staffContent.replace("import { createClient }", "import { createClient }\nimport RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'");
}
staffContent = staffContent.replace(/\{recentAnnouncements && recentAnnouncements\.length > 0 && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*\)\}/, '<RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />');
fs.writeFileSync('src/app/staff/page.tsx', staffContent);

console.log('Done teacher and staff');
