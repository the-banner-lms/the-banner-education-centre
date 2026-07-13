const fs = require('fs');

let content = fs.readFileSync('src/components/announcements/ReplySection.tsx', 'utf8');

// Remove the useState for replies and just use initialReplies directly.
content = content.replace(/const \[replies, setReplies\] = useState<Reply\[\]>\(initialReplies\);/, '');

// Replace all usages of 'replies' with 'initialReplies'
content = content.replace(/replies\.length/g, 'initialReplies.length');
content = content.replace(/replies\.map/g, 'initialReplies.map');

fs.writeFileSync('src/components/announcements/ReplySection.tsx', content);
console.log('Fixed ReplySection to use initialReplies directly');
