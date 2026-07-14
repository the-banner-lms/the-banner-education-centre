import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/supabase/queries'
import { redirect } from 'next/navigation'
import TeamForm from '@/components/team/TeamForm'

export default async function NewTeamMemberPage() {
  const supabase = await createClient()

  const isFullAdmin = await isAdmin(supabase)
  if (!isFullAdmin) {
    redirect('/admin')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-900">Add New Team Member</h1>
      <TeamForm />
    </div>
  )
}
