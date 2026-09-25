export type TeamOrderMember = {
  name?: string | null
  role?: string | null
  order_index?: number | null
  created_at?: string | null
}

export type TeamCategory = 'Founder' | 'Co Founder' | 'Staff' | 'Teacher' | 'Other'

const categoryRank: Record<TeamCategory, number> = {
  Founder: 0,
  'Co Founder': 1,
  Staff: 2,
  Teacher: 3,
  Other: 4,
}

export function getTeamCategory(member: TeamOrderMember): TeamCategory {
  const text = `${member.role || ''} ${member.name || ''}`.toLowerCase()

  if (text.includes('co-founder') || text.includes('co founder') || text.includes('cofounder')) {
    return 'Co Founder'
  }

  if (text.includes('founder')) return 'Founder'

  if (
    text.includes('manager') ||
    text.includes('ceo') ||
    text.includes('head master') ||
    text.includes('headmaster') ||
    text.includes('finance') ||
    text.includes('office') ||
    text.includes('helper') ||
    text.includes('staff') ||
    text.includes('administrator') ||
    text.includes('admin')
  ) {
    return 'Staff'
  }

  if (
    text.includes('teacher') ||
    text.includes('homeroom') ||
    text.includes('preschool') ||
    text.includes('english') ||
    text.includes('myanmar') ||
    text.includes('science') ||
    text.includes('social') ||
    text.includes('art')
  ) {
    return 'Teacher'
  }

  return 'Other'
}

export function getTeamCategoryRank(member: TeamOrderMember) {
  return categoryRank[getTeamCategory(member)]
}

export function sortTeamMembers<T extends TeamOrderMember>(members: T[] = []) {
  return [...members].sort((a, b) => {
    const categoryDiff = getTeamCategoryRank(a) - getTeamCategoryRank(b)
    if (categoryDiff !== 0) return categoryDiff

    const orderDiff = Number(a.order_index ?? 9999) - Number(b.order_index ?? 9999)
    if (orderDiff !== 0) return orderDiff

    const createdAtDiff = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    if (createdAtDiff !== 0) return createdAtDiff

    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}
