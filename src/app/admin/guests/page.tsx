import { createClient } from '@/utils/supabase/server'
import { updateUserStatus, updateUserRole } from '../users/actions'
import DeleteUserButton from '../users/DeleteUserButton'
import { isAdmin } from '@/utils/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminGuestsPage() {
  const supabase = await createClient()

  const isFullAdmin = await isAdmin(supabase)
  if (!isFullAdmin) {
    redirect('/admin')
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'guest')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading users.</div>
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-800',
    staff: 'bg-teal-100 text-teal-800',
    teacher: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
    editor: 'bg-orange-100 text-orange-800',
    guest: 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-gray-900">Guest Users</h1>
      
      <div className="mb-10 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Guest / Blog Commenters</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors['guest']}`}>
            {users.length} {users.length === 1 ? 'User' : 'Users'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group relative cursor-pointer" title={`View ${user.full_name || 'User'} Dashboard`}>
                  <td className="whitespace-nowrap p-0">
                    <Link href={`/dashboard/${user.id}`} className="flex items-center px-6 py-4 w-full h-full">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img className="h-8 w-8 rounded-full border border-gray-200 group-hover:border-indigo-400 transition-all" src={user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.email)} alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div className="ml-4">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {user.full_name || 'No Name'}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-0">
                    <Link href={`/dashboard/${user.id}`} className="block px-6 py-4 text-sm text-gray-500 w-full h-full">
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative z-10">
                    <form action={async (formData) => {
                      'use server'
                      const newRole = formData.get('role') as string
                      await updateUserRole(user.id, newRole)
                    }} className="flex items-center space-x-2">
                      <select
                        name="role"
                        defaultValue={user.role}
                        className={`text-xs rounded-full px-2 py-1 font-semibold border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${roleColors[user.role] || roleColors['guest']}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="staff">Staff</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="guest">Guest</option>
                      </select>
                      <button type="submit" className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 bg-white shadow-sm">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap p-0">
                    <Link href={`/dashboard/${user.id}`} className="block px-6 py-4 w-full h-full">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        user.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.approval_status || 'pending'}
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-0">
                    <Link href={`/dashboard/${user.id}`} className="block px-6 py-4 text-sm text-gray-500 w-full h-full">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative z-10">
                    {(!user.approval_status || user.approval_status === 'pending') && (
                      <div className="flex justify-end space-x-2">
                        <form action={updateUserStatus.bind(null, user.id, 'approved')}>
                          <button type="submit" className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors">Approve</button>
                        </form>
                        <form action={updateUserStatus.bind(null, user.id, 'rejected')}>
                          <button type="submit" className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Reject</button>
                        </form>
                        <DeleteUserButton userId={user.id} />
                      </div>
                    )}
                    {user.approval_status === 'rejected' && (
                      <div className="flex justify-end space-x-2">
                        <form action={updateUserStatus.bind(null, user.id, 'approved')}>
                          <button type="submit" className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors">Approve</button>
                        </form>
                        <DeleteUserButton userId={user.id} />
                      </div>
                    )}
                    {user.approval_status === 'approved' && (
                      <div className="flex justify-end space-x-2">
                        <form action={updateUserStatus.bind(null, user.id, 'rejected')}>
                          <button type="submit" className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Reject</button>
                        </form>
                        <DeleteUserButton userId={user.id} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No guest users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
