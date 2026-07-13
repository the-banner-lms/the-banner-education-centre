const fs = require('fs');

const studentPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const teacherPage = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');
const staffPage = fs.readFileSync('src/app/staff/page.tsx', 'utf8');

const replacementQuery = `  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role
    \`)`;

const oldQuery = `  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role
    \`)`;

fs.writeFileSync('src/app/dashboard/page.tsx', studentPage.replace(oldQuery, replacementQuery));
fs.writeFileSync('src/app/teacher/page.tsx', teacherPage.replace(oldQuery, replacementQuery));
fs.writeFileSync('src/app/staff/page.tsx', staffPage.replace(oldQuery, replacementQuery));
console.log('Final query fix applied');
