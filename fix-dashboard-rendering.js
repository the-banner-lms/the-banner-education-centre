const fs = require('fs');

const studentPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const teacherPage = fs.readFileSync('src/app/teacher/page.tsx', 'utf8');
const staffPage = fs.readFileSync('src/app/staff/page.tsx', 'utf8');

const regex3 = /announcement\.profiles\?\.first_name/g;
const regex4 = /announcement\.profiles\?\.last_name/g;

fs.writeFileSync('src/app/dashboard/page.tsx', studentPage.replace(regex3, '""').replace(regex4, '""'));
fs.writeFileSync('src/app/teacher/page.tsx', teacherPage.replace(regex3, '""').replace(regex4, '""'));
fs.writeFileSync('src/app/staff/page.tsx', staffPage.replace(regex3, '""').replace(regex4, '""'));

console.log('Fixed rendering errors');
