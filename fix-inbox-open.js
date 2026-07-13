const fs = require('fs');

let content = fs.readFileSync('src/components/announcements/RecentAnnouncementsInbox.tsx', 'utf8');

// The details element is collapsed by default. Add the `open` attribute so it's expanded on load.
if (!content.includes('<details className="group bg-white rounded-lg shadow border border-gray-200 mb-8 overflow-hidden hide-in-pdf" open>')) {
  content = content.replace(
    '<details className="group bg-white rounded-lg shadow border border-gray-200 mb-8 overflow-hidden hide-in-pdf">',
    '<details className="group bg-white rounded-lg shadow border border-gray-200 mb-8 overflow-hidden hide-in-pdf" open>'
  );
  fs.writeFileSync('src/components/announcements/RecentAnnouncementsInbox.tsx', content);
  console.log("Fixed details to be open by default");
} else {
  console.log("Already open");
}
