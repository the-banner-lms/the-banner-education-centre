const fs = require('fs');

const files = [
  'src/app/dashboard/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/staff/page.tsx',
  'src/app/teacher/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/announcements=\{recentAnnouncements \|\| \[\]\}/g, 'announcements={(recentAnnouncements as any) || []}');
  fs.writeFileSync(file, content);
}

console.log('Fixed TS errors');
