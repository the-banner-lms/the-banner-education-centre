const fs = require('fs');

const studentPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const teacherPage = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');
const staffPage = fs.readFileSync('src/app/staff/page.tsx', 'utf8');

const regex = /profiles!announcements_author_id_fkey\(first_name, last_name\)/g;

fs.writeFileSync('src/app/dashboard/page.tsx', studentPage.replace(regex, ''));
fs.writeFileSync('src/app/teacher/page.tsx', teacherPage.replace(regex, ''));
fs.writeFileSync('src/app/staff/page.tsx', staffPage.replace(regex, ''));

const regex2 = /,[\s\n]*\)/g;

fs.writeFileSync('src/app/dashboard/page.tsx', fs.readFileSync('src/app/dashboard/page.tsx', 'utf8').replace(regex2, ')'));
fs.writeFileSync('src/app/teacher/page.tsx', fs.readFileSync('src/app/teacher/page.tsx', 'utf8').replace(regex2, ')'));
fs.writeFileSync('src/app/staff/page.tsx', fs.readFileSync('src/app/staff/page.tsx', 'utf8').replace(regex2, ')'));

console.log('Fixed dashboard queries');
