const fs = require('fs');

let pageContent = fs.readFileSync('src/app/announcements/[id]/page.tsx', 'utf8');

// Replace the replies query to omit the failing profiles join
const oldRepliesQuery = `  // Fetch replies
  const { data: replies } = await supabase
    .from('announcement_replies')
    .select(\`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (
        first_name,
        last_name
      )
    \`)
    .eq('announcement_id', params.id)
    .order('created_at', { ascending: true });`;

const newRepliesQuery = `  // Fetch replies
  const { data: repliesData } = await supabase
    .from('announcement_replies')
    .select(\`
      id,
      content,
      created_at,
      user_id
    \`)
    .eq('announcement_id', params.id)
    .order('created_at', { ascending: true });

  const replies = repliesData || [];
  
  // Fetch profiles separately
  const userIds = replies.map(r => r.user_id);
  let profilesMap = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('id', userIds);
      
    if (profilesData) {
      profilesData.forEach(p => {
        profilesMap[p.id] = p;
      });
    }
  }

  // Attach profiles to replies
  const enrichedReplies = replies.map(r => ({
    ...r,
    profiles: profilesMap[r.user_id] || { first_name: 'Unknown', last_name: 'User' }
  }));`;

pageContent = pageContent.replace(oldRepliesQuery, newRepliesQuery);

// Replace the prop passed to ReplySection
pageContent = pageContent.replace('initialReplies={(replies as any) || []}', 'initialReplies={enrichedReplies}');

fs.writeFileSync('src/app/announcements/[id]/page.tsx', pageContent);
console.log('Fixed replies query in [id]/page.tsx');
