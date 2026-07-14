import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteTeamButton from './DeleteTeamButton'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  const supabase = await createClient()

  const isFullAdmin = await isAdmin(supabase)
  if (!isFullAdmin) {
    redirect('/admin')
  }

  const { data: teamMembers, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return <div>Error loading team members: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Team</h1>
        <Link 
          href="/admin/team/new" 
          className="bg-banner-dark hover:bg-opacity-90 text-white px-4 py-2 rounded-md shadow-sm font-medium transition-colors"
        >
          Add Team Member
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={member.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">Slug: {member.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <Link 
                        href={`/admin/team/${member.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors font-medium"
                      >
                        Edit
                      </Link>
                      <DeleteTeamButton id={member.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!teamMembers || teamMembers.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    No team members found. Click "Add Team Member" to create one.
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
