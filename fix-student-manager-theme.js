const fs = require('fs');

// 1. StudentManager.tsx
let smContent = fs.readFileSync('src/components/students/StudentManager.tsx', 'utf8');

if (!smContent.includes('getRoleBannerGradient')) {
  smContent = smContent.replace("import Link from 'next/link'", "import Link from 'next/link'\nimport { getRoleBannerGradient, getRoleBadgeStyle } from '@/utils/theme'");
}

smContent = smContent.replace(
  '<div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>',
  '<div className={`h-32 w-full ${getRoleBannerGradient(student.role)}`}></div>'
);

smContent = smContent.replace(
  '<p className="inline-block mt-3 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">',
  '<p className={`inline-block mt-3 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(student.role)}`}>'
);

fs.writeFileSync('src/components/students/StudentManager.tsx', smContent);

// 2. Dashboard/page.tsx
let dbContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

if (!dbContent.includes('getRoleBadgeStyle')) {
  dbContent = dbContent.replace("import WeeklyAttendanceTracker from '@/components/WeeklyAttendanceTracker'", "import WeeklyAttendanceTracker from '@/components/WeeklyAttendanceTracker'\nimport { getRoleBadgeStyle } from '@/utils/theme'");
}

dbContent = dbContent.replace(
  '<p className="inline-block mt-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">',
  '<p className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(profile.role)}`}>'
);

fs.writeFileSync('src/app/dashboard/page.tsx', dbContent);

console.log('Fixed other files');
