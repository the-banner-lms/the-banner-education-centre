const fs = require('fs');

// 1. /announcements/page.tsx
let annPage = fs.readFileSync('src/app/announcements/page.tsx', 'utf8');
annPage = annPage.replace(/profiles:author_id \(\s*first_name,\s*last_name\s*\)/g, 'author_role');
annPage = annPage.replace(/\{\(announcement\.profiles as any\)\?\.first_name\} \{\(announcement\.profiles as any\)\?\.last_name\}/g, '<span className="capitalize">{announcement.author_role || "Admin"}</span>');
fs.writeFileSync('src/app/announcements/page.tsx', annPage);

// 2. /announcements/[id]/page.tsx
let annIdPage = fs.readFileSync('src/app/announcements/[id]/page.tsx', 'utf8');
annIdPage = annIdPage.replace(/profiles:author_id \(\s*first_name,\s*last_name\s*\)/g, 'author_role');
annIdPage = annIdPage.replace(/\{announcement\.profiles\?\.first_name\} \{announcement\.profiles\?\.last_name\}/g, '<span className="capitalize">{announcement.author_role || "Admin"}</span>');
fs.writeFileSync('src/app/announcements/[id]/page.tsx', annIdPage);

// 3. /admin/announcements/page.tsx
let adminAnnPage = fs.readFileSync('src/app/admin/announcements/page.tsx', 'utf8');
adminAnnPage = adminAnnPage.replace(/\*, profiles\(first_name, last_name\)/g, '*');
fs.writeFileSync('src/app/admin/announcements/page.tsx', adminAnnPage);

// 4. /staff/announcements/page.tsx
let staffAnnPage = fs.readFileSync('src/app/staff/announcements/page.tsx', 'utf8');
staffAnnPage = staffAnnPage.replace(/\*, profiles\(first_name, last_name\)/g, '*');
fs.writeFileSync('src/app/staff/announcements/page.tsx', staffAnnPage);

// 5. AnnouncementList.tsx
let annList = fs.readFileSync('src/components/announcements/AnnouncementList.tsx', 'utf8');
annList = annList.replace(/\{item\.profiles\?\.first_name\} \{item\.profiles\?\.last_name\}/g, '<span className="capitalize">{item.author_role || "Admin"}</span>');
fs.writeFileSync('src/components/announcements/AnnouncementList.tsx', annList);

console.log("Fixed missing foreign key dependency in announcements.");
