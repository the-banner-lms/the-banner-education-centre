import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeftIcon, EnvelopeIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from('team_members')
    .select('name, role, about')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!member) {
    return { title: 'Member Not Found | The Banner Education Centre' };
  }

  return {
    title: `${member.name} - ${member.role} | The Banner Education Centre`,
    description: member.about ? member.about.substring(0, 160) : '',
  };
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

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
                src={member.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&size=512'}
                alt={member.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 160px, 192px"
              />
            </div>
            
            <div className="flex-grow space-y-2 pb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-xl text-blue-600 font-semibold">{member.role}</p>
              
              {member.email && (
                <div className="flex items-center gap-2 text-gray-500 pt-2">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${member.email}`} className="hover:text-blue-600 transition-colors">
                    {member.email}
                  </a>
                </div>
              )}
            </div>
            
            {member.email && (
              <div className="shrink-0 pb-2 hidden md:block">
                <a href={`mailto:${member.email}`} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-full transition-colors inline-block shadow-sm">
                  Connect
                </a>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            
            {/* Left Column - Main Details */}
            <div className="col-span-1 md:col-span-2 p-6 md:p-8 space-y-8 border-r border-gray-100">
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <BriefcaseIcon className="w-6 h-6 text-gray-700" />
                  About
                </h2>
                <div className="prose prose-lg text-gray-700 leading-relaxed space-y-4">
                  {member.about?.split('\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
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
            
            {/* Right Column - Skills & Education */}
            <div className="col-span-1 p-6 md:p-8 space-y-8 bg-gray-50/50 h-full">
              {member.skills && member.skills.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              
              {member.education && (
                <section>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <AcademicCapIcon className="w-6 h-6 text-gray-500" />
                    Education
                  </h2>
                  <div className="text-gray-700 text-sm space-y-1">
                    <p className="font-semibold text-base">{member.education.degree}</p>
                    <p className="text-gray-500">{member.education.university}</p>
                  </div>
                </section>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
