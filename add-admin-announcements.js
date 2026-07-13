const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('RecentAnnouncementsInbox')) {
  content = content.replace("import { createClient }", "import { createClient }\nimport RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'");
}

// 2. Add fetch logic before the return statement
const fetchLogic = `  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select(\`
      id,
      title,
      created_at,
      author_role,
      target_role
    \`)
    .in('target_role', ['all', 'admin'])
    .order('created_at', { ascending: false })
    .limit(5);

  return (`;

content = content.replace('  return (', fetchLogic);

// 3. Add component below the "Total System Admins" div
const componentJSX = `      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 inline-block mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Total System Admins</h2>
        <p className="text-3xl font-semibold text-gray-900">{adminCount || 0}</p>
      </div>
      
      <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/admin/announcements" />`;

content = content.replace(/<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 inline-block mb-8">[\s\S]*?<\/div>/, componentJSX);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Done admin');
