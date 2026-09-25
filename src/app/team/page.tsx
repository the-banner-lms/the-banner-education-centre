import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { sortTeamMembers } from '@/lib/teamOrdering';

export const metadata = {
  title: 'Our Team | The Banner Education Centre',
  description: 'Meet the dedicated team behind The Banner Education Centre.',
};

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = await createClient();
  let { data: teamMembers, error } = await supabase
    .from('team_members')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Unable to load team members with order_index:', error)
    const fallbackResult = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });

    teamMembers = fallbackResult.data
    error = fallbackResult.error
  }

  const arrangedTeamMembers = sortTeamMembers(teamMembers || []);

  return (
    <div className="flex flex-col">
      <section className="bg-banner-dark py-16 text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
            Our Dedicated Team
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Meet the passionate individuals working behind the scenes to empower the next generation.
          </p>
        </div>
      </section>
      
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {arrangedTeamMembers.map((member: any) => (
              <Link key={member.id} href={`/team/${member.id}`} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-b-4 border-transparent hover:border-blue-600 h-full flex flex-col">
                  <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    <Image
                      src={member.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&size=512'}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6 text-center flex-grow flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-blue-600 font-semibold">{member.role}</p>
                  </div>
                </div>
              </Link>
            ))}
            {arrangedTeamMembers.length === 0 && !error && (
              <p className="col-span-3 text-center text-gray-500">No team members found.</p>
            )}
            {arrangedTeamMembers.length === 0 && error && (
              <p className="col-span-3 text-center text-red-600">
                Team members could not be loaded right now.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
