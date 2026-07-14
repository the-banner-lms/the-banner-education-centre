import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

function getCoverImage(htmlContent: string): string | null {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: blog, error } = await supabase
    .from('blogs')
    .select(`
      *,
      profiles:author_id ( full_name )
    `)
    .eq('id', params.id)
    .eq('published', true)
    .single()

  if (error || !blog) {
    notFound()
  }

  const coverImageUrl = getCoverImage(blog.content);

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
            Back to Stories
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
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
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
            <div className="h-16 w-16 bg-banner-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
              {(blog.profiles?.full_name || 'A')[0].toUpperCase()}
            </div>
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
      </div>
    </div>
  )
}
