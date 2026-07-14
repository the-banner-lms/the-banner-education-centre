import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import BlogSidebar from '@/components/blogs/BlogSidebar';

export const dynamic = 'force-dynamic';

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const archive = typeof searchParams.archive === 'string' ? searchParams.archive : '';

  let query = supabase
    .from('blogs')
    .select(`
      id,
      title,
      content,
      cover_image_url,
      created_at,
      author_id,
      tags,
      profiles (full_name, avatar_url)
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: posts } = await query;

  // Filter by archive if needed
  let filteredPosts = posts || [];
  if (archive) {
    filteredPosts = filteredPosts.filter(post => {
      const date = new Date(post.created_at);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      return monthYear === archive;
    });
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-10 mb-8 border-b border-gray-200">
          <h1 className="text-4xl md:text-5xl font-bold text-banner-dark mb-4">
            Our Stories
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Insights, updates, and news from The Banner Education Centre.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No blogs found</h3>
                <p className="text-gray-500">
                  {q || archive ? 'Try adjusting your filters.' : 'Check back later for new updates.'}
                </p>
                {(q || archive) && (
                  <Link href="/blog" className="text-orange-500 hover:underline mt-4 inline-block">
                    Clear Filters
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPosts.map((post: any) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                    {post.cover_image_url && (
                      <div className="w-full md:w-1/3 h-48 md:h-auto shrink-0 relative">
                        <img 
                          src={post.cover_image_url} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {post.tags && post.tags.length > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="text-orange-500 font-medium">{post.tags[0]}</span>
                            </>
                          )}
                        </div>
                        <Link href={`/blog/${post.id}`}>
                          <h2 className="text-2xl font-bold text-gray-900 hover:text-orange-500 transition-colors mb-3">
                            {post.title}
                          </h2>
                        </Link>
                        {/* Excerpt logic: remove HTML tags and truncate */}
                        <div 
                          className="text-gray-600 line-clamp-3 mb-4 text-sm"
                          dangerouslySetInnerHTML={{ __html: post.content?.replace(/<[^>]+>/g, '').substring(0, 200) + '...' }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                              {post.profiles?.full_name ? post.profiles.full_name.charAt(0) : 'A'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{post.profiles?.full_name || 'Admin'}</span>
                        </div>
                        <Link href={`/blog/${post.id}`} className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center">
                          Read More
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-4">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
