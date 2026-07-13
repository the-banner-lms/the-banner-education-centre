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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white shadow-md flex flex-col justify-between">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Staff Panel</h2>
          <nav>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/staff" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                  <span className="ml-3">Dashboard</span>
                </Link>
              </li>
              <li>
              <Link href="/staff/students" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Manage Students</span>
              </Link>
            </li>
            <li>
              <Link href="/staff/students/fast-entry" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Fast Data Entry</span>
              </Link>
            </li>
            <li>
              <Link href="/staff/teacher-reports" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Teacher Reports</span>
              </Link>
            </li>
              <li>
                <Link href="/staff/announcements" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                  <span className="ml-3">Manage Announcements</span>
                </Link>
              </li>
              <li>
                <Link href="/staff/activities" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                  <span className="ml-3">Manage Activities</span>
                </Link>
              </li>
              <li>
                <Link href="/teacher/students" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
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
