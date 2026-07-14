import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { 
  MagnifyingGlassIcon, 
  ClockIcon, 
  FireIcon, 
  ChatBubbleLeftEllipsisIcon, 
  ArchiveBoxIcon 
} from '@heroicons/react/24/outline';

export default async function BlogSidebar() {
  const supabase = await createClient();

  // 1. Fetch recent posts
  const { data: recentPosts } = await supabase
    .from('blogs')
    .select('id, title, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(5);

  // 2. Fetch popular posts (fallback if views column not exist yet)
  const { data: popularPosts, error: popError } = await supabase
    .from('blogs')
    .select('id, title, created_at, views')
    .eq('published', true)
    .order('views', { ascending: false, nullsFirst: false })
    .limit(5);

  let actualPopular = popularPosts;
  if (popError) {
    const { data: fallbackPosts } = await supabase
      .from('blogs')
      .select('id, title, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    actualPopular = fallbackPosts as any;
  }

  // 3. Fetch recent comments
  const { data: recentComments } = await supabase
    .from('blog_comments')
    .select(`
      id,
      content,
      created_at,
      post_id,
      profiles (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // 4. Archive (Group by Month/Year)
  const { data: allDates } = await supabase
    .from('blogs')
    .select('created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  const archives: { label: string; count: number }[] = [];
  if (allDates) {
    const archiveMap: { [key: string]: number } = {};
    allDates.forEach(post => {
      const date = new Date(post.created_at);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      archiveMap[monthYear] = (archiveMap[monthYear] || 0) + 1;
    });
    
    for (const [label, count] of Object.entries(archiveMap)) {
      archives.push({ label, count });
    }
  }

  return (
    <div className="space-y-8 sticky top-24">
      {/* Widget: Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-bold text-banner-dark mb-4 pb-3 border-b border-gray-100">
          <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-orange-500" />
          Search Blog
        </h3>
        <form action="/blog" method="GET" className="relative group">
          <input 
            type="text" 
            name="q"
            placeholder="Search keywords..." 
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all outline-none text-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 group-hover:text-orange-500 transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Recent Posts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-bold text-banner-dark mb-4 pb-3 border-b border-gray-100">
          <ClockIcon className="w-5 h-5 mr-2 text-orange-500" />
          Recent Posts
        </h3>
        <ul className="space-y-4">
          {recentPosts?.map(post => (
            <li key={post.id} className="group">
              <Link href={`/blog/${post.id}`} className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </span>
                <span className="text-xs text-gray-400 mt-1.5 font-medium flex items-center">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </Link>
            </li>
          ))}
          {(!recentPosts || recentPosts.length === 0) && (
            <li className="text-sm text-gray-500 italic">No recent posts.</li>
          )}
        </ul>
      </div>

      {/* Popular Posts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-bold text-banner-dark mb-4 pb-3 border-b border-gray-100">
          <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
          Popular Posts
        </h3>
        <ul className="space-y-4">
          {actualPopular?.map(post => (
            <li key={post.id} className="group">
              <Link href={`/blog/${post.id}`} className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </span>
                <span className="text-xs text-gray-400 mt-1.5 font-medium flex items-center">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {(post as any).views !== undefined ? <span className="ml-2 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold tracking-wider uppercase">{`${(post as any).views} views`}</span> : ''}
                </span>
              </Link>
            </li>
          ))}
          {(!actualPopular || actualPopular.length === 0) && (
            <li className="text-sm text-gray-500 italic">No popular posts yet.</li>
          )}
        </ul>
      </div>

      {/* Recent Comments */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-bold text-banner-dark mb-4 pb-3 border-b border-gray-100">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-orange-500" />
          Recent Comments
        </h3>
        <ul className="space-y-4">
          {recentComments?.map(comment => (
            <li key={comment.id} className="text-sm border-l-2 border-gray-100 pl-3 py-1 hover:border-orange-400 transition-colors">
              <span className="font-bold text-gray-800 text-xs tracking-wide uppercase">{(comment as any).profiles?.full_name || 'Anonymous'}</span>
              <p className="text-gray-600 line-clamp-2 italic mt-1 text-sm">"{comment.content}"</p>
              {comment.post_id && (
                <Link href={`/blog/${comment.post_id}`} className="text-[11px] font-semibold text-orange-500 hover:text-orange-700 transition-colors mt-2 inline-flex items-center">
                  Read Context <span className="ml-1">→</span>
                </Link>
              )}
            </li>
          ))}
          {(!recentComments || recentComments.length === 0) && (
            <li className="text-sm text-gray-500 italic">No comments yet.</li>
          )}
        </ul>
      </div>

      {/* Archive */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-bold text-banner-dark mb-4 pb-3 border-b border-gray-100">
          <ArchiveBoxIcon className="w-5 h-5 mr-2 text-orange-500" />
          Archive
        </h3>
        <ul className="space-y-2.5">
          {archives.map(arch => (
            <li key={arch.label}>
              <Link href={`/blog?archive=${encodeURIComponent(arch.label)}`} className="group flex justify-between items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover:bg-orange-500 transition-colors"></span>
                  {arch.label}
                </span>
                <span className="bg-gray-50 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 border border-gray-100 group-hover:border-orange-200 px-2.5 py-0.5 rounded-full text-xs transition-colors">
                  {arch.count}
                </span>
              </Link>
            </li>
          ))}
          {archives.length === 0 && (
            <li className="text-sm text-gray-500 italic">No archives.</li>
          )}
        </ul>
      </div>

    </div>
  );
}
