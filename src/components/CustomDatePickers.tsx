'use client'

import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

// Helper to format local Date to YYYY-MM-DD
function toLocalISOString(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  return (new Date(date.getTime() - tzOffset)).toISOString().split('T')[0];
}

// Add some global styles to override react-calendar defaults for our recorded dates
const customStyles = `
  .react-calendar {
    width: 100% !important;
    max-width: 350px;
    min-width: 280px;
    border: 1px solid #e5e7eb !important;
    border-radius: 0.5rem;
    font-family: inherit !important;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4b5563;
  }
  .react-calendar__navigation button {
    border-radius: 0.375rem;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #f3f4f6 !important;
  }
  .react-calendar__tile--active {
    background: #4f46e5 !important;
    color: white !important;
    border-radius: 0.375rem;
  }
  .react-calendar__tile--now {
    background: #f3f4f6 !important;
    border-radius: 0.375rem;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background: #e0e7ff !important;
    border-radius: 0.375rem;
  }
  .recorded-day {
    background: #dcfce7 !important;
    color: #166534 !important;
    font-weight: 600 !important;
    border-radius: 0.375rem !important;
    border: 1px solid #bbf7d0 !important;
  }
  .recorded-month {
    background: #dcfce7 !important;
    color: #166534 !important;
    font-weight: 600 !important;
    border-radius: 0.375rem !important;
    border: 1px solid #bbf7d0 !important;
  }
`

export function DailyDatePicker({ recordedDates }: { recordedDates: string[] }) {
  const [date, setDate] = useState<Date>(new Date())

  return (
    <div className="flex flex-col items-start">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Calendar 
        onChange={(val) => setDate(val as Date)} 
        value={date} 
        tileClassName={({ date: tileDate, view }) => {
          if (view === 'month') {
            const dateStr = toLocalISOString(tileDate);
            if (recordedDates.includes(dateStr)) {
              return 'recorded-day';
            }
          }
          return null;
        }}
      />
      <input type="hidden" name="date" value={toLocalISOString(date)} />
      <p className="text-sm text-gray-500 mt-3">
        Selected Date: <span className="font-semibold text-gray-900">{toLocalISOString(date)}</span>
      </p>
    </div>
  )
}

export function WeeklyDatePicker({ recordedWeeks }: { recordedWeeks: string[] }) {
  const [date, setDate] = useState<Date>(new Date())
  
  // Always calculate the Monday of the selected week to ensure consistency
  // because the dashboard filters by the start of the week (Monday).
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date);
  monday.setDate(diff);
  const weekStartStr = toLocalISOString(monday);

  return (
    <div className="flex flex-col items-start">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Calendar 
        onChange={(val) => setDate(val as Date)} 
        value={date} 
        tileClassName={({ date: tileDate, view }) => {
          if (view === 'month') {
            const tDay = tileDate.getDay();
            const tDiff = tileDate.getDate() - tDay + (tDay === 0 ? -6 : 1);
            const tMonday = new Date(tileDate);
            tMonday.setDate(tDiff);
            const tMondayStr = toLocalISOString(tMonday);

            const tSunday = new Date(tMonday);
            tSunday.setDate(tSunday.getDate() + 6);
            const tSundayStr = toLocalISOString(tSunday);

            const hasRecord = recordedWeeks.some(rec => rec >= tMondayStr && rec <= tSundayStr);
            if (hasRecord) {
              return 'recorded-day';
            }
          }
          return null;
        }}
      />
      <input type="hidden" name="week_start_date" value={weekStartStr} />
      <p className="text-sm text-gray-500 mt-3">
        Selected Week Start (Monday): <span className="font-semibold text-gray-900">{weekStartStr}</span>
      </p>
    </div>
  )
}

export function MonthlyDatePicker({ recordedMonths }: { recordedMonths: string[] }) {
  const [date, setDate] = useState<Date>(new Date())

  // For month_year, format is YYYY-MM
  const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-start">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Calendar 
        onChange={(val) => setDate(val as Date)} 
        value={date} 
        view="year" // show months
        onClickMonth={(val) => setDate(val as Date)} // select month directly
        maxDetail="year" // Don't allow drilling down to days
        tileClassName={({ date: tileDate, view }) => {
          if (view === 'year') {
            const my = `${tileDate.getFullYear()}-${String(tileDate.getMonth() + 1).padStart(2, '0')}`;
            if (recordedMonths.includes(my)) {
              return 'recorded-month';
            }
          }
          return null;
        }}
      />
      <input type="hidden" name="month_year" value={monthYear} />
      <p className="text-sm text-gray-500 mt-3">
        Selected Month: <span className="font-semibold text-gray-900">{monthYear}</span>
      </p>
    </div>
  )
}
