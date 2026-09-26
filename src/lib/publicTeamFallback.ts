export type PublicTeamMember = {
  id: string
  name: string
  role: string
  bio: string
  image_url: string | null
  order_index: number
  created_at: string
}

// Recovered from the Supabase database backup downloaded from the paused project.
// This keeps the public Our Team page showing the edited team rows even while
// the live Supabase project is paused and cannot serve database/storage reads.
export const publicTeamFallbackMembers: PublicTeamMember[] = [
  {
    id: '0eb1baa6-625c-42e4-b27a-56d3bbab3329',
    name: 'Tr Swe Zin Oo',
    role: 'Founder and Teacher',
    bio: 'I am a mother of a lovely son who is 11 years old. Since 2015, I have been dedicated to nurturing young minds as an early childhood educator and the founder of The Banner Nature-based Education. My mission is to cultivate resilience and emotional health in children within my local community and through collaborations with NGOs and INGOs.\nI specialize in designing programs that integrate holistic development, mental wellbeing and mindfulness through hands-on art, stories and nature-based exploration. By creating calm, creative spaces, I help children build the essential tools they need for a balanced and mindful start to life.',
    image_url: '/images/team/recovered/tr-swe-zin-oo.jpeg',
    order_index: 0,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: '1aef6bf6-937b-4209-948c-b4a371356030',
    name: 'U Nyein Chan Lynn',
    role: 'Co-founder and Principal',
    bio: 'U Nyein Chan Lynn oversees the educational programs and ensures that every student receives the support they need. With extensive experience in educational leadership, he guides the vision and direction of The Banner Education Centre.',
    image_url: '/images/team/recovered/u-nyein-chan-lynn.jpg',
    order_index: 1,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: '65782da7-2e71-4850-ae46-99f5a00356fc',
    name: 'Tr May Thingyan Oo',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 10,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: 'b1c340e8-5488-4a1f-96d6-b9a8c82ca04c',
    name: 'Tr Theint Theint Thu',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 11,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: 'c9ca9943-bce8-4294-92c6-6a891777ddb8',
    name: 'Tr May Thu',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 12,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: '0afee9c4-6637-4e54-9aab-a69d1a20e76f',
    name: 'Tr Thant Haythar Htut',
    role: 'Preschool Teacher',
    bio: 'Assigned classes: Pre-KG\nPosition: Preschool Teacher',
    image_url: null,
    order_index: 14,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: '7a575246-4e5c-43e0-8c66-0f9274009445',
    name: 'Tr Htet Wint War',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: KG\nPosition: Homeroom Teacher',
    image_url: '/images/team/recovered/htet-wint-war.jpg',
    order_index: 15,
    created_at: '2026-07-24T19:48:34.235462Z',
  },
  {
    id: '5e4bab5b-40cc-4584-ad91-e060b4e2f726',
    name: 'Tr Htet Htet Aung',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: KG\nPosition: Homeroom Teacher',
    image_url: '/images/team/recovered/htet-htet-aung.jpg',
    order_index: 16,
    created_at: '2026-07-24T19:48:34.712544Z',
  },
  {
    id: '8a21ee8a-5069-455e-b2d1-9c83fbf81516',
    name: 'Tr Kayay Aung',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: Grade 1\nPosition: Homeroom Teacher',
    image_url: '/images/team/recovered/kayay-aung.jpeg',
    order_index: 17,
    created_at: '2026-07-24T19:48:35.255341Z',
  },
  {
    id: '20dccfa9-90fe-415a-bdb6-e4fd9db57bc2',
    name: 'Tr Moe Myat Thwe',
    role: 'Homeroom Teacher',
    bio: 'Assigned classes: Grade 2\nPosition: Homeroom Teacher',
    image_url: '/images/team/recovered/moe-myat-thwe.jpeg',
    order_index: 18,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: 'edaf91cd-6464-43a5-9310-305f7f2dc866',
    name: 'Tr Aye Mon Htwe',
    role: 'Myanmar Teacher',
    bio: 'Assigned classes: Grade 1, Grade 2, Year 5, Year 8\nPosition: Myanmar Teacher',
    image_url: '/images/team/recovered/aye-mon-htwe.jpg',
    order_index: 19,
    created_at: '2026-07-24T19:48:36.107245Z',
  },
  {
    id: '86e3cbed-d460-4368-a5d8-19997b56241d',
    name: 'Tr Thant Wutt Yee',
    role: 'English Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: English Teacher',
    image_url: '/images/team/recovered/thant-wutt-yee.jpg',
    order_index: 20,
    created_at: '2026-07-24T19:48:36.576353Z',
  },
  {
    id: 'faf2781d-026d-485a-aff0-a3532ebc6e16',
    name: 'Tr Nyee Linn Nyo',
    role: 'Science and Art Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: Science and Art Teacher',
    image_url: '/images/team/recovered/nyee-linn-nyo.jpg',
    order_index: 21,
    created_at: '2026-07-24T19:48:37.047815Z',
  },
  {
    id: '44e7c5f0-4e36-4386-ba41-af52bd46429c',
    name: 'Tr Hayman Moe',
    role: 'Social Studies Teacher',
    bio: 'Assigned classes: Year 5, Year 8\nPosition: Social Studies Teacher',
    image_url: '/images/team/recovered/hayman-moe.jpeg',
    order_index: 22,
    created_at: '2026-07-24T19:48:37.471295Z',
  },
  {
    id: 'bd819933-7a2a-49e4-aea1-f4d55bc91159',
    name: 'Tr Khin Mar San',
    role: 'Art and Crafts Teacher',
    bio: 'Assigned classes: Grade 1, Grade 2, Year 5, Year 8\nPosition: Art and Crafts Teacher',
    image_url: '/images/team/recovered/khin-mar-san.jpeg',
    order_index: 23,
    created_at: '2026-07-24T19:48:37.884338Z',
  },
  {
    id: 'e212aafb-37f8-49d7-b7f1-72a012fec4d4',
    name: 'Tr Aye Thandar Lynn',
    role: 'Science and Social Teacher',
    bio: 'Assigned classes: KG, Grade 1, Grade 2\nPosition: Science and Social Teacher',
    image_url: '/images/team/recovered/aye-thandar-lynn.jpg',
    order_index: 24,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
  {
    id: 'fff6d661-a294-4f7a-89e2-2e2492416e1b',
    name: 'Daw Khin Sandar Hlaing',
    role: 'Manager (Finance and Communication)',
    bio: 'Position: Manager',
    image_url: null,
    order_index: 25,
    created_at: '2026-07-14T18:08:10.785197Z',
  },
]

export function getPublicTeamFallbackMember(id: string) {
  return publicTeamFallbackMembers.find((member) => member.id === id) || null
}
