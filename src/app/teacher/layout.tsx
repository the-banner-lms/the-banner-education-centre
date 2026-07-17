import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isTeacher } from '@/utils/supabase/queries'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const hasAccess = await isTeacher(supabase)

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
          <h2 className="text-xl font-bold text-gray-800 mb-6">Teacher Panel</h2>
          <nav>
            <ul className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 font-medium">
              <li>
                <Link href="/teacher" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                  <span className="ml-3">Dashboard</span>
                </Link>
              </li>
              <li>
              <Link href="/teacher/students" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                <span className="ms-3">My Students</span>
              </Link>
            </li>
            <li>
              <Link href="/teacher/attendance" className="flex flex-shrink-0 items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group whitespace-nowrap">
                <span className="ms-3">Take Attendance</span>
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

      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
}
