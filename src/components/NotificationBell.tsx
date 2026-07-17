'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import { markAnnouncementAsRead } from '@/app/actions/announcementActions';
import { markEnrollmentReviewNoticeAsRead } from '@/app/actions/enrollmentActions';

interface NotificationItem {
  id: string;
  title: string;
  created_at: string;
  href: string;
  kind: 'announcement' | 'enrollment_review';
}

interface NotificationBellProps {
  unreadNotifications: NotificationItem[];
}

const notificationDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  timeZone: 'Asia/Yangon',
});

export default function NotificationBell({ unreadNotifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(unreadNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (notification: NotificationItem) => {
    setNotifications(previous => previous.filter(item => !(item.id === notification.id && item.kind === notification.kind)));
    if (notification.kind === 'enrollment_review') {
      void markEnrollmentReviewNoticeAsRead(notification.id);
    } else {
      void markAnnouncementAsRead(notification.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-indigo-600 focus:outline-none transition-colors rounded-full hover:bg-gray-100"
        aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <BellIcon className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-20 z-50 mt-2 w-auto overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-500">{notifications.length} unread</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No new notifications
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li key={`${notification.kind}:${notification.id}`} className="flex items-start hover:bg-gray-50 transition-colors">
                    <Link
                      href={notification.href}
                      className="block min-w-0 flex-1 px-4 py-3"
                      onClick={() => {
                        setIsOpen(false);
                        markAsRead(notification);
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notificationDateFormatter.format(new Date(notification.created_at))}
                      </p>
                    </Link>
                    <button
                      onClick={() => markAsRead(notification)}
                      className="mr-4 mt-3 flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap bg-indigo-50 px-2 py-1 rounded"
                      title="Mark as read"
                    >
                      Mark Read
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50">
            <Link 
              href="/announcements" 
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              onClick={() => setIsOpen(false)}
            >
              View all announcements
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
