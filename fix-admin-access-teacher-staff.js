const fs = require('fs');

// 1. Fix src/app/teacher/page.tsx
let tContent = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');

if (!tContent.includes("['all', 'teacher', 'staff', 'admin', 'student']")) {
  tContent = tContent.replace(
    ".in('target_role', ['all', 'teacher'])",
    ".in('target_role', user.role === 'admin' ? ['all', 'teacher', 'staff', 'admin', 'student'] : ['all', 'teacher'])"
  );
  fs.writeFileSync('src/app/teacher/page.tsx', tContent);
}

// 2. Fix src/app/staff/page.tsx
// It uses getRecentAnnouncementsForRole

// 3. Fix src/utils/supabase/announcements.ts
let aContent = fs.readFileSync('src/utils/supabase/announcements.ts', 'utf8');

if (!aContent.includes("['all', 'admin', 'staff', 'teacher', 'student']")) {
  aContent = aContent.replace(
    ".in('target_role', role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', role])",
    ".in('target_role', role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', role])" // already there from before!
  );
  fs.writeFileSync('src/utils/supabase/announcements.ts', aContent);
}

// Actually, wait, Teacher dashboard doesn't fetch the user's role before querying, it just hardcodes 'teacher'
tContent = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');

const queryFix = `
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role,
      target_role
    \`)
    .in('target_role', profile?.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', 'teacher'])
    .order('created_at', { ascending: false })
    .limit(5);`;

if (!tContent.includes('const { data: profile }')) {
    tContent = tContent.replace(
`  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role,
      target_role
    \`)
    .in('target_role', ['all', 'teacher'])
    .order('created_at', { ascending: false })
    .limit(5);`,
    queryFix
  );
  fs.writeFileSync('src/app/teacher/page.tsx', tContent);
}
console.log("Fixed teacher access");
