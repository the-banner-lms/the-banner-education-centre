import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

function getCoverImage(htmlContent: string): string | null {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

function truncateText(html: string, maxLength: number) {
  const text = html.replace(/<[^>]+>/g, '') // Strip HTML tags
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

export default async function BlogPage() {
  const supabase = await createClient()

  // Fetch from the actual blogs table
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select(`
      *,
      profiles:author_id ( full_name )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-banner-dark mb-4">
            Our Stories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Insights, updates, and inspiring stories from The Banner Education Centre
          </p>
        </div>

        {error && (
          <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
            Error loading blogs. Please try again later.
          </div>
        )}

        {!error && (!blogs || blogs.length === 0) ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No blogs found</h3>
            <p className="text-gray-500">Check back later for new updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs?.map((blog) => {
              const coverImage = getCoverImage(blog.content);
              return (
                <Link 
                  key={blog.id} 
                  href={`/blog/${blog.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 transform hover:-translate-y-1"
                >
                  <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                    {coverImage ? (
                      <Image 
                        src={coverImage} 
                        alt={blog.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-banner-dark/5">
                        <svg className="h-16 w-16 text-banner-dark/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1 text-banner-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-banner-dark transition-colors line-clamp-2">
                      {blog.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-6 flex-1 line-clamp-3">
                      {truncateText(blog.content, 150)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-banner-dark rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                          {(blog.profiles?.full_name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {blog.profiles?.full_name || 'Admin'}
                        </span>
                      </div>
                      <span className="text-banner-gold group-hover:translate-x-1 transition-transform inline-block">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
