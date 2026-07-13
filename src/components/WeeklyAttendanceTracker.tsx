import React from 'react';
import Link from 'next/link';

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'off';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  morning_status: AttendanceStatus | null;
  afternoon_status: AttendanceStatus | null;
}

interface WeeklyAttendanceTrackerProps {
  weekStartDate: string; // YYYY-MM-DD (Should be Monday)
  attendanceRecords: AttendanceRecord[];
  prevWeekUrl: string;
  nextWeekUrl: string;
}

export default function WeeklyAttendanceTracker({
  weekStartDate,
  attendanceRecords,
  prevWeekUrl,
  nextWeekUrl
}: WeeklyAttendanceTrackerProps) {
  
  const startDate = new Date(weekStartDate);
  
  const getDayDate = (offset: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const formatDateString = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const getDayLabel = (d: Date) => {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };
  const getDayShortLabel = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = getDayDate(i);
    const dateStr = formatDateString(d);
    const record = attendanceRecords.find(r => r.date === dateStr);
    return {
      date: d,
      dateStr,
      morning_status: record?.morning_status || null,
      afternoon_status: record?.afternoon_status || null
    };
  });

  const endDateStr = getDayShortLabel(getDayDate(6));
  const startDateStr = getDayShortLabel(startDate);

  const presentCount = days.reduce((acc, d) => acc + (d.morning_status === 'present' ? 1 : 0) + (d.afternoon_status === 'present' ? 1 : 0), 0);
  const absentCount = days.reduce((acc, d) => acc + (d.morning_status === 'absent' ? 1 : 0) + (d.afternoon_status === 'absent' ? 1 : 0), 0);
  const leaveCount = days.reduce((acc, d) => acc + (d.morning_status === 'leave' ? 1 : 0) + (d.afternoon_status === 'leave' ? 1 : 0), 0);
  const offCount = days.reduce((acc, d) => acc + (d.morning_status === 'off' ? 1 : 0) + (d.afternoon_status === 'off' ? 1 : 0), 0);
  
  const recordedSessions = presentCount + absentCount + leaveCount;
  const attendanceRate = recordedSessions > 0 ? Math.round((presentCount / recordedSessions) * 100) : 0;

  const getStatusColor = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Present', border: 'border-green-200' };
      case 'absent': return { bg: 'bg-red-100', text: 'text-red-700', icon: '❌', label: 'Absent', border: 'border-red-200' };
      case 'leave': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠️', label: 'Leave', border: 'border-yellow-200' };
      case 'off': return { bg: 'bg-gray-200', text: 'text-gray-700', icon: '⏸️', label: 'Off Day', border: 'border-gray-300' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-500', icon: '—', label: 'No Data', border: 'border-gray-200' };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* 1. Summary Dashboard Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 flex flex-col items-center justify-center border border-indigo-100">
            <span className="text-sm font-medium text-indigo-600 mb-1">Attendance Rate</span>
            <span className="text-3xl font-black text-indigo-700">{attendanceRate}%</span>
          </div>
          <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center border border-green-100">
            <span className="text-sm font-medium text-green-700 mb-1">Present</span>
            <span className="text-3xl font-black text-green-700">{presentCount}</span>
            <span className="text-xs text-green-600 mt-1">Sessions</span>
          </div>
          <div className="bg-red-50 rounded-lg p-4 flex flex-col items-center justify-center border border-red-100">
            <span className="text-sm font-medium text-red-700 mb-1">Absent</span>
            <span className="text-3xl font-black text-red-700">{absentCount}</span>
            <span className="text-xs text-red-600 mt-1">Sessions</span>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center justify-center border border-yellow-100">
            <span className="text-sm font-medium text-yellow-700 mb-1">Leave</span>
            <span className="text-3xl font-black text-yellow-700">{leaveCount}</span>
            <span className="text-xs text-yellow-600 mt-1">Sessions</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-200">
            <span className="text-sm font-medium text-gray-700 mb-1">Off Days</span>
            <span className="text-3xl font-black text-gray-700">{offCount}</span>
            <span className="text-xs text-gray-500 mt-1">Sessions</span>
          </div>
        </div>
      </section>

      {/* 2. Weekly Grid / Timeline View */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Weekly Breakdown</h2>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <Link href={prevWeekUrl} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
              &larr; Prev Week
            </Link>
            <span className="text-sm font-semibold text-gray-700">{startDateStr} - {endDateStr}, {startDate.getFullYear()}</span>
            <Link href={nextWeekUrl} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
              Next Week &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          {days.map((day, idx) => {
            const amStyle = getStatusColor(day.morning_status);
            const pmStyle = getStatusColor(day.afternoon_status);
            return (
              <div key={idx} className="flex md:flex-col justify-between md:justify-start bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex flex-col mb-0 md:mb-4">
                  <span className="text-sm font-bold text-gray-700">{getDayLabel(day.date)}</span>
                  <span className="text-xs text-gray-500">{getDayShortLabel(day.date)}</span>
                </div>
                
                <div className="flex md:flex-col space-x-4 md:space-x-0 md:space-y-3">
                  {/* AM Session */}
                  <div className={`flex items-center p-2 rounded-md ${amStyle.bg} border ${amStyle.border}`}>
                    <span className="text-xs font-bold text-gray-500 w-6 mr-1">AM</span>
                    <span className="text-base mr-1">{amStyle.icon}</span>
                    <span className={`text-xs font-semibold ${amStyle.text} hidden md:inline-block`}>{amStyle.label}</span>
                  </div>
                  {/* PM Session */}
                  <div className={`flex items-center p-2 rounded-md ${pmStyle.bg} border ${pmStyle.border}`}>
                    <span className="text-xs font-bold text-gray-500 w-6 mr-1">PM</span>
                    <span className="text-base mr-1">{pmStyle.icon}</span>
                    <span className={`text-xs font-semibold ${pmStyle.text} hidden md:inline-block`}>{pmStyle.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend / Status Indicators Guide */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 font-medium mr-2">Status Guide:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Present (✅)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Absent (❌)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-gray-600">Leave (⚠️)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300"></span>
            <span className="text-gray-600">No Data (—)</span>
          </div>
        </div>

      </section>
    </div>
  );
}
