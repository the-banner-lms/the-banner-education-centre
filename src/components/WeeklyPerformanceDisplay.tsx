'use client';

import React from 'react';
import Link from 'next/link';

export interface PerformanceRecord {
  id: string;
  week_start_date: string;
  burmese_score: string | null;
  english_score: string | null;
  math_score: string | null;
  science_score: string | null;
  sports_score: string | null;
  art_score: string | null;
  social_score: string | null;
  health_score: string | null;
  teamwork_score: string | null;
  discipline_score: string | null;
  remarks: string | null;
}

interface WeeklyPerformanceDisplayProps {
  performances: PerformanceRecord[];
  weekStartDate: string;
  prevWeekUrl: string;
  nextWeekUrl: string;
}

function getScoreData(scoreStr: string | null) {
  if (!scoreStr) return { percentage: 0, barColor: 'bg-gray-200', textColor: 'text-gray-500', bgColor: 'bg-gray-50', label: 'Not Graded' };
  const s = scoreStr.toLowerCase().trim();
  if (s.includes('excellent') || s === 'a') return { percentage: 100, barColor: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', label: scoreStr };
  if (s.includes('good') || s === 'b') return { percentage: 75, barColor: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', label: scoreStr };
  if (s.includes('fair') || s === 'c') return { percentage: 50, barColor: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50', label: scoreStr };
  if (s.includes('poor') || s.includes('need') || s === 'd' || s === 'f') return { percentage: 25, barColor: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50', label: scoreStr };
  
  // Default fallback for any custom text
  return { percentage: 100, barColor: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50', label: scoreStr };
}

export default function WeeklyPerformanceDisplay({
  performances,
  weekStartDate,
  prevWeekUrl,
  nextWeekUrl
}: WeeklyPerformanceDisplayProps) {
  const subjects = [
    { key: 'burmese_score', name: 'Burmese', icon: '🇲🇲' },
    { key: 'english_score', name: 'English', icon: '🇬🇧' },
    { key: 'math_score', name: 'Math', icon: '📐' },
    { key: 'science_score', name: 'Science', icon: '🔬' },
    { key: 'sports_score', name: 'Sports', icon: '⚽' },
    { key: 'art_score', name: 'Art', icon: '🎨' },
    { key: 'social_score', name: 'Social', icon: '🤝' },
    { key: 'health_score', name: 'Health', icon: '🩺' },
    { key: 'teamwork_score', name: 'Teamwork', icon: '👥' },
    { key: 'discipline_score', name: 'Discipline', icon: '⚖️' },
  ];

  const formattedDate = new Date(weekStartDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Header & Navigation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📊</span> Weekly Performance
        </h2>
        <div className="flex items-center gap-4 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <Link
            href={prevWeekUrl}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Previous Week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">
            Week of {formattedDate}
          </div>
          <Link
            href={nextWeekUrl}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Next Week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>
      </div>

      <div className="p-6">
        {!performances || performances.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Performance Data</h3>
            <p className="text-gray-500 text-sm">There is no performance report available for the week of {formattedDate}.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {performances.map((perf, idx) => (
              <div key={perf.id} className={idx > 0 ? "pt-8 border-t border-gray-100" : ""}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recorded on: {new Date(perf.week_start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {subjects.map((sub) => {
                    const score = perf[sub.key as keyof PerformanceRecord] as string | null;
                    const data = getScoreData(score);
                    
                    return (
                      <div key={sub.key} className={`rounded-lg border border-gray-100 p-4 shadow-sm flex flex-col justify-between ${data.bgColor} hover:shadow-md transition-shadow`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl" title={sub.name}>{sub.icon}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${data.barColor} text-white`}>
                            {data.label}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">{sub.name}</h4>
                          <div className="w-full bg-white rounded-full h-2 shadow-inner">
                            <div className={`h-2 rounded-full ${data.barColor}`} style={{ width: `${data.percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {perf.remarks && (
                  <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <p className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-1">Teacher&apos;s Remarks</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{perf.remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
