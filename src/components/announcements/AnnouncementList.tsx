'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { deleteAnnouncement } from '@/app/actions/announcementActions';

interface Announcement {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  target_role?: string;
  author_role?: string;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  roleBasePath: string;
  currentUserId: string;
  currentUserRole: string;
}

export default function AnnouncementList({ announcements, roleBasePath, currentUserId, currentUserRole }: AnnouncementListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    startTransition(async () => {
      await deleteAnnouncement(id);
    });
  };

  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <h3 className="text-gray-500 font-medium mb-4">No announcements found.</h3>
        <Link 
          href={`${roleBasePath}/new`}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          Create First Announcement
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Manage Announcements</h2>
        <Link 
          href={`${roleBasePath}/new`}
          className="self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 sm:self-auto"
        >
          + New Announcement
        </Link>
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
      <table className="min-w-[760px] divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {announcements.map((item) => {
            const canEdit = currentUserRole === 'admin' || currentUserId === item.author_id;
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/announcements/${item.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {item.target_role || 'all'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="capitalize">{item.author_role || "Admin"}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <div className="flex justify-end gap-3">
                      <Link 
                        href={`${roleBasePath}/${item.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
