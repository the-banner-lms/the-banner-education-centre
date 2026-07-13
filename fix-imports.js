const fs = require('fs');

const files = [
  'src/app/admin/page.tsx',
  'src/app/staff/page.tsx',
  'src/app/teacher/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import { createClient }\nimport RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'", "import { createClient } from '@/utils/supabase/server'\nimport RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'");
  fs.writeFileSync(file, content);
}

console.log('Fixed imports');
