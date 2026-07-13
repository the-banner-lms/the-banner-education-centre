const fs = require('fs');

const studentPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Looking for the NEXT_REDIRECT stack trace...
// It failed because of "Unauthorized. This dashboard is for students." or similar redirect logic

console.log(studentPage.includes("redirect('/login')"));
console.log(studentPage.includes("return <div className=\"p-8 text-center text-red-500\">Profile not found.</div>"));

