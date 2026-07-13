const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/[id]/page.tsx', 'utf8');

// Add import
if (!content.includes('getRoleBannerGradient')) {
  content = content.replace("import Link from 'next/link'", "import Link from 'next/link'\nimport { getRoleBannerGradient, getRoleBadgeStyle } from '@/utils/theme'");
}

// Replace banner
content = content.replace(
  '<div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>',
  '<div className={`h-32 w-full ${getRoleBannerGradient(profile.role)}`}></div>'
);

// Replace badge
content = content.replace(
  '<p className="inline-block mt-3 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">',
  '<p className={`inline-block mt-3 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(profile.role)}`}>'
);

fs.writeFileSync('src/app/dashboard/[id]/page.tsx', content);
console.log('Fixed dashboard/[id]/page.tsx');
