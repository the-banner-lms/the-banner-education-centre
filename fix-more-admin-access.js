const fs = require('fs');

function replaceSafe(file, from, to) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(from, to);
  fs.writeFileSync(file, content);
}

replaceSafe('src/components/Navbar.tsx',
  ".in('target_role', ['all', profile.role])",
  ".in('target_role', profile.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', profile.role])"
);

replaceSafe('src/app/admin/page.tsx',
  ".in('target_role', ['all', 'admin'])",
  ".in('target_role', ['all', 'admin', 'staff', 'teacher', 'student'])"
);

replaceSafe('src/app/dashboard/page.tsx',
  ".in('target_role', ['all', profile.role])",
  ".in('target_role', profile.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', profile.role])"
);

replaceSafe('src/utils/supabase/announcements.ts',
  ".in('target_role', ['all', role])",
  ".in('target_role', role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', role])"
);

console.log('Fixed more access');
