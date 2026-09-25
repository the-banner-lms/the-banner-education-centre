import { teamMembers as legacyTeamMembers } from '@/data/teamMembers'

export type PublicTeamMember = {
  id: string
  name: string
  role: string
  bio: string
  image_url: string | null
  order_index: number
  created_at: string
}

const teacherMembers: PublicTeamMember[] = [
  {
    id: 'tr-may-thingyan-oo',
    name: 'Tr May Thingyan Oo',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 20,
    created_at: '2026-01-01T00:20:00.000Z',
  },
  {
    id: 'tr-theint-theint-thu',
    name: 'Tr Theint Theint Thu',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 21,
    created_at: '2026-01-01T00:21:00.000Z',
  },
  {
    id: 'tr-may-thu',
    name: 'Tr May Thu',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 22,
    created_at: '2026-01-01T00:22:00.000Z',
  },
  {
    id: 'tr-eingyin-wathan',
    name: 'Tr Eingyin Wathan',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 23,
    created_at: '2026-01-01T00:23:00.000Z',
  },
  {
    id: 'tr-thant-haythar-htut',
    name: 'Tr Thant Haythar Htut',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 24,
    created_at: '2026-01-01T00:24:00.000Z',
  },
  {
    id: 'tr-htet-wint-war',
    name: 'Tr Htet Wint War',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: KG\nPosition: Homeroom Teacher',
    image_url: '/images/team/teachers/htet-wint-war.jpg',
    order_index: 25,
    created_at: '2026-01-01T00:25:00.000Z',
  },
  {
    id: 'tr-htet-htet-aung',
    name: 'Tr Htet Htet Aung',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: KG\nPosition: Homeroom Teacher',
    image_url: '/images/team/teachers/htet-htet-aung.jpg',
    order_index: 26,
    created_at: '2026-01-01T00:26:00.000Z',
  },
  {
    id: 'tr-kayay-aung',
    name: 'Tr Kayay Aung',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: Grade 1\nPosition: Homeroom Teacher',
    image_url: '/images/team/teachers/kayay-aung.jpeg',
    order_index: 27,
    created_at: '2026-01-01T00:27:00.000Z',
  },
  {
    id: 'tr-moe-myat-thwe',
    name: 'Tr Moe Myat Thwe',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: Grade 2\nPosition: Homeroom Teacher',
    image_url: '/images/team/teachers/moe-myat-thwe.jpeg',
    order_index: 28,
    created_at: '2026-01-01T00:28:00.000Z',
  },
  {
    id: 'tr-aye-mon-htwe',
    name: 'Tr Aye Mon Htwe',
    role: 'Myanmar Teacher',
    bio: 'Assigned classes: Grade 1, Grade 2, Year 5, Year 8\nPosition: Myanmar Teacher',
    image_url: null,
    order_index: 29,
    created_at: '2026-01-01T00:29:00.000Z',
  },
  {
    id: 'tr-thant-wutt-yee',
    name: 'Tr Thant Wutt Yee',
    role: 'English Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: English Teacher',
    image_url: '/images/team/teachers/thant-wutt-yee.jpg',
    order_index: 30,
    created_at: '2026-01-01T00:30:00.000Z',
  },
  {
    id: 'tr-nyee-linn-nyo',
    name: 'Tr Nyee Linn Nyo',
    role: 'Science and Art Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: Science and Art Teacher',
    image_url: '/images/team/teachers/nyee-linn-nyo.jpg',
    order_index: 31,
    created_at: '2026-01-01T00:31:00.000Z',
  },
  {
    id: 'tr-hayman-moe',
    name: 'Tr Hayman Moe',
    role: 'Social Studies Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: Social Studies Teacher',
    image_url: '/images/team/teachers/hayman-moe.jpeg',
    order_index: 32,
    created_at: '2026-01-01T00:32:00.000Z',
  },
  {
    id: 'tr-khin-mar-san',
    name: 'Tr Khin Mar San',
    role: 'Art and Crafts Teacher',
    bio: 'Assigned classes: Grade 1, Grade 2, Year 5, Year 8\nPosition: Art and Crafts Teacher',
    image_url: '/images/team/teachers/khin-mar-san.jpeg',
    order_index: 33,
    created_at: '2026-01-01T00:33:00.000Z',
  },
  {
    id: 'tr-aye-thandar-lynn',
    name: 'Tr Aye Thandar Lynn',
    role: 'Science and Social Teacher',
    bio: 'Assigned classes: KG, Grade 1, Grade 2\nPosition: Science and Social Teacher',
    image_url: '/images/team/teachers/aye-thandar-lynn.jpg',
    order_index: 34,
    created_at: '2026-01-01T00:34:00.000Z',
  },
  {
    id: 'daw-khin-sandar-hlaing',
    name: 'Daw Khin Sandar Hlaing',
    role: 'Manager',
    bio: 'Position: Manager',
    image_url: null,
    order_index: 12,
    created_at: '2026-01-01T00:12:00.000Z',
  },
]

export const publicTeamFallbackMembers: PublicTeamMember[] = [
  ...legacyTeamMembers.map((member, index) => ({
    id: member.slug,
    name: member.name,
    role: member.role,
    bio: member.about,
    image_url: member.image,
    order_index: index,
    created_at: `2026-01-01T00:${String(index).padStart(2, '0')}:00.000Z`,
  })),
  ...teacherMembers,
]

export function getPublicTeamFallbackMember(id: string) {
  return publicTeamFallbackMembers.find((member) => member.id === id) || null
}
