'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import { createBlog, updateBlog } from '@/app/actions/blogActions';

interface BlogFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    published: boolean;
  };
  roleBasePath: string; // e.g. '/admin/blogs' or '/staff/blogs'
}

export default function BlogForm({ initialData, roleBasePath }: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isEditing = !!initialData;

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
    formData.append('published', String(published));

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateBlog(initialData.id, formData);
        } else {
          await createBlog(formData);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Blog Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
            placeholder="E.g., How to study effectively"
            required
          />
        </div>
        <div>
          <label htmlFor="published" className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <select
            id="published"
            value={published ? 'true' : 'false'}
            onChange={(e) => setPublished(e.target.value === 'true')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
          >
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <RichTextEditor
          label="Main Content (Upload images directly here using the image icon)"
          value={content}
          onChange={setContent}
          required
        />
      </div>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
          {isPending ? 'Saving...' : isEditing ? 'Update Blog' : 'Publish Blog'}
        </button>
      </div>
    </form>
  );
}
