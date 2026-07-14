import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/supabase/queries'
import { redirect } from 'next/navigation'
import TeamForm from '@/components/team/TeamForm'

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()

  const isFullAdmin = await isAdmin(supabase)
  if (!isFullAdmin) {
    redirect('/admin')
  }

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !teamMember) {
    return <div>Error loading team member or not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-900">Edit Team Member</h1>
      <TeamForm initialData={teamMember} />
    </div>
  )
}
