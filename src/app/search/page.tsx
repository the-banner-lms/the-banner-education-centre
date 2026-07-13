import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SearchInput from '@/components/SearchInput'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string
  type: 'User' | 'Textbook' | 'Lesson' | 'Blog' | 'Announcement' | 'Activity' | 'Team' | 'Page'
  title: string
  subtitle: string
  link: string
  imageUrl?: string | null
}

export default async function SearchPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  // Normalize Burmese Zero (U+1040) to Burmese Wa (U+101D) because users frequently type Zero by mistake
  const rawQuery = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const query = rawQuery.replace(/\u1040/g, '\u101D')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const results: SearchResult[] = []

  // Static site content for search
  const staticContent = [
    {
      id: 'home-intro',
      type: 'Page' as const,
      title: 'Nature-based Education',
      subtitle: 'Home Page',
      content: 'The Banner Nature-based Education NURTURING YOUNG MINDS IN NATURE. Welcome to The Banner Education Centre.',
      link: '/#home-intro'
    },
    {
      id: 'home-primary',
      type: 'Page' as const,
      title: 'Primary Education (Grades 1 to 5) မူလတန်းပညာရေး',
      subtitle: 'Home Page',
      content: 'Our primary curriculum is designed to build a strong foundation in core subjects while maintaining a deep connection with nature and arts. We nurture academic excellence alongside creativity. ကျွန်ုပ်တို့၏ မူလတန်းသင်ရိုးညွှန်းတမ်းသည် အဓိကဘာသာရပ်များတွင် ခိုင်မာသော အခြေခံအုတ်မြစ်ကို တည်ဆောက်ပေးနိုင်ရန်နှင့် သဘာဝတရား၊ အနုပညာတို့နှင့် နက်ရှိုင်းစွာ ချိတ်ဆက်နိုင်ရန် ရည်ရွယ်ရေးဆွဲထားပါသည်။ Burmese (မြန်မာစာ), English, Casco Math, Science, Art, Music, Nature',
      link: '/#home-primary'
    },
    {
      id: 'home-curriculum',
      type: 'Page' as const,
      title: 'Curriculum သင်ရိုးညွှန်းတမ်း',
      subtitle: 'Home Page',
      content: 'In our pre-kindergarten and kindergarten classes, we utilize age-appropriate methods for teaching. We recognize that every child is unique and has their own pace. Our curriculum is grounded in Rudolf Steiner\'s philosophy and approaches, while also emphasizing the EYFS curriculum in Myanmar. Pre-kindergarten နှင့် kindergarten အတန်းများတွင် ကလေးငယ်များ၏ အသက်အရွယ်နှင့် ကိုက်ညီသော သင်ကြားမှုနည်းစနစ်များကို အသုံးပြုပါသည်။ ကလေးတိုင်းသည် ထူးခြားပြီး သူတို့ကိုယ်ပိုင် သင်ယူမှုနှုန်းထားရှိသည်ကို ကျွန်ုပ်တို့ နားလည်လက်ခံပါသည်။ ကျွန်ုပ်တို့၏ သင်ရိုးသည် Rudolf Steiner ၏ ဒဿနနှင့် ချဉ်းကပ်မှုများကို အခြေခံထားပြီး မြန်မာနိုင်ငံ၏ EYFS သင်ရိုးကိုလည်း အလေးထားပါသည်။',
      link: '/#home-curriculum'
    },
    {
      id: 'home-free-play',
      type: 'Page' as const,
      title: 'Free Play လွတ်လပ်စွာကစားခြင်း',
      subtitle: 'Home Page',
      content: 'As you know, play is the essential work of childhood, and learning through experience lays the groundwork for active imagination, problem-solving, and creative thinking. Moreover, the more they play, the healthier they will be. Therefore, our primary activity at school is play. ကစားခြင်းသည် ကလေးဘဝ၏ အရေးကြီးဆုံး လုပ်ငန်းစဉ်တစ်ခုဖြစ်ပြီး အတွေ့အကြုံမှတစ်ဆင့် သင်ယူခြင်းက တက်ကြွသော စိတ်ကူးစိတ်သန်း၊ ပြဿနာဖြေရှင်းနိုင်စွမ်းနှင့် ဖန်တီးနိုင်စွမ်းတို့အတွက် အုတ်မြစ်ချပေးပါသည်။',
      link: '/#home-free-play'
    },
    {
      id: 'home-seasonal',
      type: 'Page' as const,
      title: 'Seasonal Activities ရာသီအလိုက် လှုပ်ရှားမှုများ',
      subtitle: 'Home Page',
      content: 'We go through the three seasons in Myanmar with seasonal activities like gardening, preparing a nature table, looking at flowers in our school yards and seasonal crafts and so on. မြန်မာနိုင်ငံ၏ ရာသီဥတုသုံးပါးကို ဖြတ်သန်းရာတွင် ဥယျာဉ်စိုက်ပျိုးခြင်း၊ သဘာဝပြခန်းလေးများ (Nature table) ပြင်ဆင်ခြင်း၊ ကျောင်းဝင်းအတွင်းရှိ ပန်းများကို လေ့လာခြင်းနှင့် ရာသီအလိုက် လက်မှုပညာများ စသည့် လှုပ်ရှားမှုများကို ပြုလုပ်ပါသည်။',
      link: '/#home-seasonal'
    },
    {
      id: 'home-handwork',
      type: 'Page' as const,
      title: 'Hand Work လက်မှုပညာ',
      subtitle: 'Home Page',
      content: 'We do lots of handwork in our daily rhythm. Concentration, small muscle development and hand-eye coordination are all essential precursors to reading and writing. နေ့စဉ်လှုပ်ရှားမှုများတွင် လက်မှုပညာကို များစွာထည့်သွင်းထားပါသည်။ အာရုံစူးစိုက်မှု၊ ကြွက်သားငယ်များ ဖွံ့ဖြိုးမှုနှင့် မျက်စိ-လက် ပူးပေါင်းဆောင်ရွက်မှုတို့သည် စာဖတ်ခြင်းနှင့် စာရေးခြင်းတို့အတွက် မရှိမဖြစ် လိုအပ်သော အခြေခံများဖြစ်ပါသည်။',
      link: '/#home-handwork'
    },
    {
      id: 'home-storytelling',
      type: 'Page' as const,
      title: 'Storytelling and Singing ပုံပြင်ပြောခြင်းနှင့် သီချင်းဆိုခြင်း',
      subtitle: 'Home Page',
      content: 'As we inspired Waldorf approaches in our school, we use the method of Waldorf storytelling in our daily rhythm. We create a different story for each month and we do lots of repetition. ကျွန်ုပ်တို့ကျောင်းသည် Waldorf ချဉ်းကပ်မှုကို အားကျအတုယူထားသည့်အတွက် နေ့စဉ်လှုပ်ရှားမှုများတွင် Waldorf ပုံပြင်ပြောခြင်းနည်းစနစ်ကို အသုံးပြုပါသည်။ လတစ်လအတွက် ပုံပြင်တစ်ပုဒ် ဖန်တီးပြီး ထပ်ခါတလဲလဲ ပြောပြလေ့ရှိပါသည်။ ဤနည်းအားဖြင့် ကလေး၏ မှတ်ဉာဏ်ဖွံ့ဖြိုးလာသည့်အပြင် ဘာသာစကား၏ အလှတရားနှင့် ဖော်ပြနိုင်စွမ်းကိုပါ သိရှိခံစားလာနိုင်ပါသည်။',
      link: '/#home-storytelling'
    },
    {
      id: 'home-sustainability',
      type: 'Page' as const,
      title: 'Sustainability and Nature-based Environment ရေရှည်တည်တံ့မှုနှင့် သဘာဝအခြေခံ ပတ်ဝန်းကျင်',
      subtitle: 'Home Page',
      content: 'Our school is located in Myanmar, Asia. Our school setting is surrounded by nature in the community. And the materials and products used are mainly natural, human and environmental friendly... ကျွန်ုပ်တို့ကျောင်းသည် အာရှတိုက်၊ မြန်မာနိုင်ငံတွင် တည်ရှိပြီး ကျောင်းပတ်ဝန်းကျင်မှာ သဘာဝတရားများဖြင့် ဝန်းရံထားပါသည်။ အသုံးပြုသော ပစ္စည်းများနှင့် ထုတ်ကုန်များသည် အဓိကအားဖြင့် သဘာဝပစ္စည်းများ၊ လူသားနှင့် ပတ်ဝန်းကျင်ကို ထိခိုက်မှုမရှိစေသော ပစ္စည်းများဖြစ်ပါသည်။',
      link: '/#home-sustainability'
    },
    {
      id: 'home-faculty',
      type: 'Page' as const,
      title: 'Faculty in Nature-based Education သဘာဝအခြေခံပညာရေးမှ ဆရာ၊ ဆရာမများ',
      subtitle: 'Home Page',
      content: 'The faculty at our nature-based school includes wildlife experts, housewives, the expert of machines, crafty and early childhood educators. ကျွန်ုပ်တို့ သဘာဝအခြေခံကျောင်းမှ ဆရာ၊ ဆရာမများတွင် တောရိုင်းတိရစ္ဆာန် ကျွမ်းကျင်သူများ၊ အိမ်ရှင်မများ၊ စက်မှုကျွမ်းကျင်သူများ၊ လက်မှုပညာရှင်များနှင့် အစောပိုင်း ကလေးသူငယ် ပညာရေးပညာရှင်များ ပါဝင်ပါသည်။',
      link: '/#home-faculty'
    }
  ]

  if (query) {
    const q = `%${query}%`

    const [
      profilesRes,
      textbooksRes,
      lessonsRes,
      blogsRes,
      announcementsRes,
      albumsRes,
      videosRes,
      teamRes
    ] = await Promise.all([
      supabase.from('profiles').select('*').or(`full_name.ilike.${q},email.ilike.${q},role.ilike.${q}`).limit(10),
      supabase.from('textbooks').select('*').or(`title.ilike.${q},description.ilike.${q}`).limit(10),
      supabase.from('lessons').select('id, title, content').or(`title.ilike.${q},content.ilike.${q}`).limit(10),
      supabase.from('blog_posts').select('*').eq('published', true).or(`title.ilike.${q},content.ilike.${q}`).limit(10),
      supabase.from('announcements').select('*').eq('is_active', true).or(`title.ilike.${q},content.ilike.${q}`).limit(10),
      supabase.from('albums').select('*').ilike('title', q).limit(10),
      supabase.from('activity_videos').select('*').ilike('title', q).limit(10),
      supabase.from('team_members').select('*').or(`name.ilike.${q},role.ilike.${q},bio.ilike.${q}`).limit(10)
    ])

    if (profilesRes.data) {
      results.push(...profilesRes.data.map(p => ({
        id: p.id,
        type: 'User' as const,
        title: p.full_name || 'No Name',
        subtitle: `${p.role} • ${p.email}`,
        link: `/dashboard/${p.id}`,
        imageUrl: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.email || 'U')}`
      })))
    }
    if (textbooksRes.data) {
      results.push(...textbooksRes.data.map(t => ({
        id: t.id,
        type: 'Textbook' as const,
        title: t.title,
        subtitle: t.grade_level || 'General',
        link: `/textbook`,
        imageUrl: t.cover_url
      })))
    }
    if (lessonsRes.data) {
      results.push(...lessonsRes.data.map(l => ({
        id: l.id,
        type: 'Lesson' as const,
        title: l.title,
        subtitle: 'Lesson',
        link: `/textbook`,
      })))
    }
    if (blogsRes.data) {
      results.push(...blogsRes.data.map(b => ({
        id: b.id,
        type: 'Blog' as const,
        title: b.title,
        subtitle: 'Blog Post',
        link: `/blog/${b.slug}`,
        imageUrl: b.cover_url
      })))
    }
    if (announcementsRes.data) {
      results.push(...announcementsRes.data.map(a => ({
        id: a.id,
        type: 'Announcement' as const,
        title: a.title,
        subtitle: 'Announcement',
        link: `/dashboard`,
      })))
    }
    if (albumsRes.data) {
      results.push(...albumsRes.data.map(a => ({
        id: a.id,
        type: 'Activity' as const,
        title: a.title,
        subtitle: 'Photo Album',
        link: `/activities`,
        imageUrl: a.cover_url
      })))
    }
    if (videosRes.data) {
      results.push(...videosRes.data.map(v => ({
        id: v.id,
        type: 'Activity' as const,
        title: v.title,
        subtitle: 'Video',
        link: `/activities`,
      })))
    }
    if (teamRes.data) {
      results.push(...teamRes.data.map(t => ({
        id: t.id,
        type: 'Team' as const,
        title: t.name,
        subtitle: t.role,
        link: `/`,
        imageUrl: t.image_url
      })))
    }

    // Filter static content
    const lowerQuery = query.toLowerCase()
    const matchedStaticContent = staticContent.filter(
      item => item.title.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery)
    )
    
    results.push(...matchedStaticContent.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      link: item.link
    })))
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Global Search</h1>
      
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <form method="GET" action="/search" className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex-grow relative">
            <label htmlFor="q" className="sr-only">Search</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              id="q"
              defaultValue={query}
              placeholder="Search anything across the site..."
              className="block w-full pl-10 border-gray-300 rounded-xl shadow-sm focus:ring-banner-light focus:border-banner-dark sm:text-base p-3 border transition-shadow"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-3 px-6 sm:px-8 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-banner-dark hover:bg-[#0c5126] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banner-dark transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-gray-700">Results for <span className="font-bold text-gray-900">"{query}"</span></h2>
          
          {Object.keys(groupedResults).length > 0 ? (
            Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="bg-banner-light/10 px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-banner-dark">{category}s ({items.length})</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <Link href={item.link} className="flex items-center space-x-4">
                        {item.imageUrl ? (
                          <div className="flex-shrink-0 relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                            {/* Using img tag to avoid Next.js Image domain config issues for external avatars */}
                            <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-banner-light/20 text-banner-dark flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-banner-dark transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
