const fs = require('fs');

// 1. Fix src/app/announcements/page.tsx
let annContent = fs.readFileSync('src/app/announcements/page.tsx', 'utf8');

annContent = annContent.replace(
  ".in('target_role', ['all', profile.role])",
  ".in('target_role', profile.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', profile.role])"
);
fs.writeFileSync('src/app/announcements/page.tsx', annContent);

// 2. Fix src/app/dashboard/[id]/page.tsx
let dbContent = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

dbContent = dbContent.replace(
  ".in('target_role', ['all', profile.role])",
  ".in('target_role', currentUserProfile.role === 'admin' ? ['all', 'admin', 'staff', 'teacher', 'student'] : ['all', profile.role])"
);

// Fix the Edit links for Admin/Staff/Teacher
const editLinksOld = `{hasAdminNav && isStudent && (
        <div className="mb-4 hide-in-pdf flex items-center justify-between">
          <Link href="/admin/students" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            &larr; Back to Directory
          </Link>
          <Link href={\`/admin/students/\${studentId}\`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">
            Edit Performance Data
          </Link>
        </div>
      )}`;

const editLinksNew = `  const getBasePath = (role: string) => {
    switch(role) {
      case 'admin': return '/admin/students';
      case 'staff': return '/staff/students';
      case 'teacher': return '/teacher/students';
      default: return null;
    }
  };
  const basePath = getBasePath(currentUserProfile.role);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">
      {basePath && isStudent && user.id !== studentId && (
        <div className="mb-4 hide-in-pdf flex items-center justify-between">
          <Link href={basePath} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            &larr; Back to Directory
          </Link>
          <Link href={\`\${basePath}/\${studentId}\`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">
            Edit Performance Data
          </Link>
        </div>
      )}`;

dbContent = dbContent.replace(
  '  return (\n    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">\n' + editLinksOld,
  editLinksNew
);

// Fix the Inbox positioning to be properly conditionally rendered below the profile section, and remove the rogue one
dbContent = dbContent.replace(
  '      <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />\n\n',
  ''
);

// And append it correctly
const inboxCondition = `      {user.id === studentId && (
        <RecentAnnouncementsInbox announcements={(recentAnnouncements as any) || []} viewAllHref="/announcements" />
      )}

      {isStudent && (`;

dbContent = dbContent.replace('      {isStudent && (', inboxCondition);

fs.writeFileSync('src/app/dashboard/[id]/page.tsx', dbContent);

console.log('Fixed access rights and layout');
