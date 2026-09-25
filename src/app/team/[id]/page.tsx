import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeftIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getPublicTeamFallbackMember } from '@/lib/publicTeamFallback';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from('team_members')
    .select('name, role, bio')
    .eq('id', resolvedParams.id)
    .single();

  const fallbackMember = member || getPublicTeamFallbackMember(resolvedParams.id);

  if (!fallbackMember) {
    return { title: 'Member Not Found | The Banner Education Centre' };
  }

  return {
    title: `${fallbackMember.name} - ${fallbackMember.role} | The Banner Education Centre`,
    description: fallbackMember.bio ? fallbackMember.bio.substring(0, 160) : '',
  };
}

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error) {
    console.error('Unable to load team member detail:', error)
  }

  const member = data || getPublicTeamFallbackMember(resolvedParams.id);

  if (!member) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16 flex-grow">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-banner-dark to-banner-light relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative">
          <Link 
            href="/team"
            className="absolute top-6 left-4 md:left-8 text-white flex items-center gap-2 hover:underline bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm transition-all hover:bg-black/40"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Team
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-end border-b border-gray-100">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0 bg-gray-100 flex items-center justify-center">
              <Image
                src={member.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&size=512'}
                alt={member.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 160px, 192px"
              />
            </div>
            
            <div className="flex-grow space-y-2 pb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-xl text-blue-600 font-semibold">{member.role}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 gap-0">
            
            {/* Left Column - Main Details */}
            <div className="p-6 md:p-8 space-y-8 border-gray-100">
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <BriefcaseIcon className="w-6 h-6 text-gray-700" />
                  Bio
                </h2>
                <div className="prose prose-lg text-gray-700 leading-relaxed space-y-4">
                  {member.bio?.split('\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  {!member.bio && <p className="text-gray-500 italic">No bio available.</p>}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <StarIcon className="w-6 h-6 text-yellow-500" />
                  Current Role
                </h2>
                <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-600">
                  <h3 className="font-bold text-lg">{member.role}</h3>
                  <p className="text-gray-600 text-sm mb-2">The Banner Education Centre • Present</p>
                  <p className="text-gray-700">Dedicated to providing excellence in education and fostering a supportive learning environment.</p>
                </div>
              </section>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
