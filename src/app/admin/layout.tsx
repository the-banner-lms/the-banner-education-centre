import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPanelAccess, isAdmin } from '@/utils/supabase/queries'
import AdminNavigation from '@/components/admin/AdminNavigation'

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
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-gray-100 md:h-[calc(100vh-6rem)] md:min-h-0 md:flex-row md:overflow-hidden">
      <AdminNavigation isFullAdmin={isFullAdmin} />

      <div className="w-full min-w-0 flex-1 p-4 md:overflow-y-auto md:p-8">
        {children}
      </div>
    </div>
  )
}
