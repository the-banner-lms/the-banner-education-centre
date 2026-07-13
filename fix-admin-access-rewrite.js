const fs = require('fs');

// The rewrite from earlier overwrote the role-based back/edit button logic
// Let's implement BOTH features carefully

let content = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

const oldHeader = `      {hasAdminNav && isStudent && (
        <div className="mb-4 hide-in-pdf flex items-center justify-between">
          <Link href="/admin/students" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            &larr; Back to Directory
          </Link>
          <Link href={\`/admin/students/\${studentId}\`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">
            Edit Performance Data
          </Link>
        </div>
      )}`;

const correctHeader = `  const getBasePath = (role: string) => {
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

if (content.includes(oldHeader)) {
  content = content.replace(
    '  return (\n    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">\n' + oldHeader,
    correctHeader
  );
  fs.writeFileSync('src/app/dashboard/[id]/page.tsx', content);
  console.log("Fixed dashboard/[id]/page.tsx edit buttons");
} else {
  console.log("Could not find the old header block, perhaps it was already replaced?");
}

