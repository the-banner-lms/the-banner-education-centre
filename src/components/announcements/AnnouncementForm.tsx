'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import { createAnnouncement, updateAnnouncement } from '@/app/actions/announcementActions';

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    target_role?: string;
  };
  roleBasePath: string; // e.g. '/admin/announcements' or '/staff/announcements'
}

export default function AnnouncementForm({ initialData, roleBasePath }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [targetRole, setTargetRole] = useState(initialData?.target_role || 'all');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isEditing = !!initialData;
  const editorDraftKey = `announcement:${roleBasePath}:${initialData?.id || 'new'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      setError('Title and content are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('target_role', targetRole);

    startTransition(async () => {
      const result = isEditing
        ? await updateAnnouncement(initialData.id, formData)
        : await createAnnouncement(formData);

      if (result.error) {
        setError(result.error);
      } else {
        localStorage.removeItem(`banner-editor-draft:${editorDraftKey}`);
        router.push(roleBasePath);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Announcement Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
            placeholder="E.g., Final Exam Schedule Updates"
            required
          />
        </div>
        <div>
          <label htmlFor="target_role" className="block text-sm font-semibold text-gray-700 mb-2">
            Target Audience
          </label>
          <select
            id="target_role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
          >
            <option value="all">Everyone</option>
            <option value="student">Students Only</option>
            <option value="teacher">Teachers Only</option>
            <option value="staff">Staff Only</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <RichTextEditor
          label="Main Content"
          value={content}
          onChange={setContent}
          draftKey={editorDraftKey}
          required
        />
      </div>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => router.push(roleBasePath)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : isEditing ? 'Update Announcement' : 'Publish Announcement'}
        </button>
      </div>
    </form>
  );
}
