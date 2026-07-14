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
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Team</h1>
        <Link 
          href="/admin/team/new" 
          className="self-start rounded-md bg-banner-dark px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-opacity-90 sm:self-auto"
        >
          Add Team Member
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200 md:hidden">
          {teamMembers?.map((member) => (
            <article key={member.id} className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <img
                  className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                  src={member.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)}
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-gray-900">{member.name}</h2>
                  <p className="truncate text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              {member.bio && <p className="line-clamp-2 text-sm text-gray-500">{member.bio}</p>}
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <Link
                  href={`/admin/team/${member.id}/edit`}
                  className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Edit
                </Link>
                <DeleteTeamButton id={member.id} />
              </div>
            </article>
          ))}
          {(!teamMembers || teamMembers.length === 0) && (
            <p className="p-6 text-center text-sm text-gray-500">No team members found.</p>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                  Bio
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
                        <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={member.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                    {member.bio || 'N/A'}
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
                    No team members found. Click &quot;Add Team Member&quot; to create one.
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
