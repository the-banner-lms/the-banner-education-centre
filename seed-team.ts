import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { teamMembers } from './src/data/teamMembers'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding team members...')
  
  // check if any exist
  const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true })
  
  if (count && count > 0) {
    console.log(`Table already has ${count} members. Skipping seed.`)
    return
  }
  
  const { data, error } = await supabase.from('team_members').insert(teamMembers.map((m, index) => ({
    name: m.name,
    role: m.role,
    bio: m.about,
    image_url: m.image,
    order_index: index
  })))

  if (error) {
    console.error('Error seeding team members:', error)
  } else {
    console.log('Successfully seeded team members.')
  }
}

seed()
