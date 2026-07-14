import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isStaff } from '@/utils/supabase/queries'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const hasAccess = await isStaff(supabase)

  if (!hasAccess) {
    redirect('/')
  }

  // Handle logout action
  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      <aside className="w-full md:w-64 bg-white shadow-md flex-shrink-0 flex flex-col justify-between">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Staff Panel</h2>
          <nav>
            <ul className="flex flex-row flex-wrap md:flex-col gap-2 md:gap-0 md:space-y-2 font-medium">
              <li>
                <Link href="/staff" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3">Dashboard</span>
                </Link>
              </li>
              <li>
              <Link href="/staff/students" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                <span className="ms-3">Manage Students</span>
              </Link>
            </li>
            <li>
              <Link href="/staff/students/fast-entry" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                <span className="ms-3">Fast Data Entry</span>
              </Link>
            </li>
            <li>
              <Link href="/staff/teacher-reports" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                <span className="ms-3">Teacher Reports</span>
              </Link>
            </li>
              <li>
                <Link href="/staff/announcements" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3">Manage Announcements</span>
                </Link>
              </li>
              <li>
                <Link href="/staff/blogs" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3">Manage Blogs</span>
                </Link>
              </li>

              <li>
                <Link href="/staff/activities" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3">Manage Activities</span>
                </Link>
              </li>
              <li>
                <Link href="/teacher/students" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3 text-sm text-gray-500">(Go to Teacher Panel)</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <form action={handleLogout}>
            <button type="submit" className="w-full text-left flex items-center p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <span className="ml-3 font-medium">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
