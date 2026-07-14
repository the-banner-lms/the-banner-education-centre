import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPanelAccess, isAdmin } from '@/utils/supabase/queries'
import Link from 'next/link'
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  BriefcaseIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon,
  EnvelopeIcon,
  BoltIcon,
  ClipboardDocumentCheckIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

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
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
        <div className="h-auto md:h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-6 font-medium">
            
            {/* 1. Dashboard */}
            <li>
              <Link href="/admin" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <HomeIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-900 transition duration-75" />
                <span className="ms-3">Dashboard</span>
              </Link>
            </li>

            {/* 2. Users & Access */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Users & Access</h3>
              <ul className="space-y-1">
                {isFullAdmin && (
                  <>
                    <li>
                      <Link href="/admin/users" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                        <UsersIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                        <span className="ms-3">All Users</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/live-users" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                        <SignalIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                        <span className="ms-3">Live Users</span>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link href="/admin/students" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <AcademicCapIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Manage Students</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/guests" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <UserGroupIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Guest Users</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/team" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <BriefcaseIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Manage Team</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Content Management */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/admin/announcements" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <SpeakerWaveIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Announcements</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/blogs" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <DocumentTextIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Blogs</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/comments" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Comments</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/activities" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <StarIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Activities</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/messages" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <EnvelopeIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Messages</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* 4. Data & Reports */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data & Reports</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/admin/students/fast-entry" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <BoltIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Fast Data Entry</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/teacher-reports" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition duration-75 ml-1" />
                    <span className="ms-3">Teacher Reports</span>
                  </Link>
                </li>
              </ul>
            </div>

          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {children}
      </div>
    </div>
  )
}

