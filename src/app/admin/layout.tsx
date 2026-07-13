import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPanelAccess, isAdmin } from '@/utils/supabase/queries'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminPanelAccess = await hasAdminPanelAccess(supabase)
  if (!adminPanelAccess) {
    redirect('/')
  }

  const isFullAdmin = await isAdmin(supabase)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              <Link href="/admin" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Dashboard</span>
              </Link>
            </li>
            {isFullAdmin && (
              <>
                <li>
                  <Link href="/admin/users" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <span className="ms-3">Users</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/live-users" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <span className="ms-3">Live Users</span>
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link href="/admin/students" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Manage Students</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/students/fast-entry" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Fast Data Entry</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/teacher-reports" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Teacher Reports</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/announcements" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Manage Announcements</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/messages" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Platform Messages</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/activities" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <span className="ms-3">Manage Activities</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
