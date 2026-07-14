'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { deleteBlog, toggleBlogStatus } from '@/app/actions/blogActions';

interface Blog {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  published: boolean;
}

interface BlogListProps {
  blogs: Blog[];
  roleBasePath: string;
  currentUserId: string;
  currentUserRole: string;
}

export default function BlogList({ blogs, roleBasePath, currentUserId, currentUserRole }: BlogListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    startTransition(async () => {
      await deleteBlog(id);
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleBlogStatus(id, !currentStatus);
    });
  };


  if (!blogs || blogs.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <h3 className="text-gray-500 font-medium mb-4">No posts found.</h3>
        <Link 
          href={`${roleBasePath}/new`}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          Create First Post
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Manage Posts</h2>
        <Link 
          href={`${roleBasePath}/new`}
          className="self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 sm:self-auto"
        >
          + New Post
        </Link>
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
      <table className="min-w-[680px] divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {blogs.map((item) => {
            const canEdit = currentUserRole === 'admin' || currentUserId === item.author_id;
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/blog/${item.id}`} target="_blank" className="text-sm font-medium text-orange-600 hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.published ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <div className="flex justify-end gap-3 items-center">
                      <button 
                        onClick={() => handleToggleStatus(item.id, item.published)}
                        disabled={isPending}
                        className={`${item.published ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'} disabled:opacity-50`}
                      >
                        {item.published ? 'Set as Draft' : 'Publish'}
                      </button>
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
