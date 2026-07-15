import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BlogComments from '@/components/blog/BlogComments'
import BlogSidebar from '@/components/blogs/BlogSidebar'
import { getBlogLabels } from '@/utils/blogs'

export const dynamic = 'force-dynamic'

function getCoverImage(htmlContent: string): string | null {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()

  const { data: blog, error } = await supabase
    .from('blogs')
    .select(`
      *,
      profiles:author_id ( full_name )
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !blog) {
    notFound()
  }

  // Get previous post (chronologically older)
  const { data: prevPost } = await supabase
    .from('blogs')
    .select('id, title')
    .eq('published', true)
    .lt('created_at', blog.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get next post (chronologically newer)
  const { data: nextPost } = await supabase
    .from('blogs')
    .select('id, title')
    .eq('published', true)
    .gt('created_at', blog.created_at)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // Increment views asynchronously (swallow error if views column doesn't exist yet)
  supabase.from('blogs').update({ views: ((blog as any).views || 0) + 1 }).eq('id', blog.id).then();


  const coverImageUrl = getCoverImage(blog.content);
  const labels = getBlogLabels(blog.tags);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] bg-banner-dark flex items-center justify-center">
        {coverImageUrl ? (
          <>
            <Image 
              src={coverImageUrl} 
              alt={blog.title} 
              fill 
              className="object-cover opacity-40" 
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-banner-dark/90 via-banner-dark/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-banner-dark/80" />
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-16">
          <Link href="/blog" className="inline-flex items-center text-banner-light hover:text-white transition-colors mb-6 font-medium text-sm">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Stories (or view another category)
          </Link>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {blog.title}
          </h1>
          
          <div className="flex items-center justify-center text-banner-light space-x-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-banner-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{blog.profiles?.full_name || 'Admin'}</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-banner-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time dateTime={blog.created_at}>
                {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
            </div>
          </div>
          
          {labels.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {labels.map(tag => (
                <Link
                  key={tag.toLocaleLowerCase()}
                  href={`/blog?label=${encodeURIComponent(tag)}`}
                  className="px-4 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 backdrop-blur-sm shadow-sm hover:bg-white/20 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
        <article 
          className="prose prose-lg prose-orange max-w-none
            prose-headings:text-banner-dark prose-headings:font-bold
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-strong:text-gray-900 prose-strong:font-bold"
          dangerouslySetInnerHTML={{ __html: blog.content }} 
        />
        
        {/* Author Bio Section */}
        <div className="mt-16 pt-10 border-t border-gray-200">
          <div className="flex items-center">
            {blog.profiles?.avatar_url ? (
              <img src={blog.profiles.avatar_url} alt={blog.profiles.full_name} className="h-16 w-16 rounded-full object-cover border-2 border-gray-200" referrerPolicy="no-referrer" />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(blog.profiles?.full_name || 'Admin')}&background=random&color=fff`} alt={blog.profiles?.full_name || 'Admin'} className="h-16 w-16 rounded-full object-cover border-2 border-gray-200" />
            )}
            <div className="ml-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Written by {blog.profiles?.full_name || 'Admin'}
              </h3>
              <p className="text-gray-600">
                The Banner Education Centre
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 border-t border-gray-200 pt-8">
          {prevPost ? (
            <Link 
              href={`/blog/${prevPost.id}`}
              className="w-full sm:w-1/2 flex flex-col items-start p-4 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
            >
              <span className="text-sm text-gray-500 mb-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Post
              </span>
              <span className="font-semibold text-banner-dark line-clamp-1">{prevPost.title}</span>
            </Link>
          ) : <div className="w-full sm:w-1/2"></div>}
          
          {nextPost ? (
            <Link 
              href={`/blog/${nextPost.id}`}
              className="w-full sm:w-1/2 flex flex-col items-end text-right p-4 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
            >
              <span className="text-sm text-gray-500 mb-1 flex items-center justify-end">
                Next Post
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <span className="font-semibold text-banner-dark line-clamp-1">{nextPost.title}</span>
            </Link>
          ) : <div className="w-full sm:w-1/2"></div>}
        </div>

        {/* Comments Section */}
        <BlogComments postId={blog.id} />
          </div>
          
          <div className="lg:col-span-4">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
