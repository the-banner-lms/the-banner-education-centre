import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'New Message | The Banner Education Centre',
}

export const dynamic = 'force-dynamic'

export default async function NewMessagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all profiles except current user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .neq('id', user.id)
    .order('role')
    .order('full_name')

  // Group profiles by role
  const groupedProfiles = (profiles || []).reduce((acc, profile) => {
    const role = profile.role || 'Unknown';
    if (!acc[role]) acc[role] = [];
    acc[role].push(profile);
    return acc;
  }, {} as Record<string, any[]>)

  const roleOrder = ['super_admin', 'admin', 'staff', 'teacher', 'student']

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center">
        <Link href="/messages" className="text-indigo-600 hover:text-indigo-800 mr-4">
          &larr; Back to Inbox
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Start a Conversation</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <p className="text-gray-500 mb-6">Select a user to send a direct message.</p>

        {roleOrder.map((role) => {
          const roleProfiles = groupedProfiles[role]
          if (!roleProfiles || roleProfiles.length === 0) return null

          return (
            <div key={role} className="mb-8 last:mb-0">
              <h2 className="text-lg font-semibold text-gray-900 capitalize border-b pb-2 mb-4">
                {role.replace('_', ' ')}s
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {roleProfiles.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/messages/${p.id}`}
                    className="flex items-center p-3 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mr-3">
                      {p.avatar_url ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={p.avatar_url} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {p.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.full_name || p.email}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
