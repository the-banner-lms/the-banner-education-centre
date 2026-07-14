'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import { createBlog, updateBlog, deleteBlog } from '@/app/actions/blogActions';

interface BlogFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    published: boolean;
    tags?: string[] | null;
  };
  roleBasePath: string; // e.g. '/admin/blogs' or '/staff/blogs'
}

export default function BlogForm({ initialData, roleBasePath }: BlogFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (typeof initialData?.tags === 'string' ? initialData.tags : ''));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isEditing = !!initialData;
  const editorDraftKey = `blog:${roleBasePath}:${initialData?.id || 'new'}`;
  const clearEditorDraft = () => localStorage.removeItem(`banner-editor-draft:${editorDraftKey}`);

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setError(null);
    startTransition(async () => {
      try {
        await deleteBlog(initialData.id);
        clearEditorDraft();
        router.push(roleBasePath);
      } catch (err: any) {
        setError(err.message || 'An error occurred while deleting');
      }
    });
  };

  const submitWithStatus = (e: React.MouseEvent, submitStatus: boolean) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required');
      return;
    }
    if (!content || content === '<p><br></p>') {
      setError('Content is required');
      return;
    }
    
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('published', submitStatus ? 'true' : 'false');
        formData.append('tags', tags);

        if (isEditing && initialData?.id) {
          formData.append('id', initialData.id);
          await updateBlog(initialData.id, formData);
        } else {
          await createBlog(formData);
        }
        clearEditorDraft();
        router.push(roleBasePath);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    });
  };

  return (
    <form className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Post Title <span className="text-red-500">*</span>
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
      </div>
      
      <div className="mb-6">
        <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
          Tags / Labels
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"
          placeholder="E.g., Education, Tips, English (comma separated)"
        />
        <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas.</p>
      </div>

      <div className="mb-6">
        <RichTextEditor
          label="Main Content (Upload images directly here using the image icon)"
          value={content}
          onChange={setContent}
          draftKey={editorDraftKey}
          required
        />
      </div>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 font-medium px-4 py-2 transition-colors disabled:opacity-50"
              disabled={isPending}
            >
              Delete Post
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(roleBasePath)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => submitWithStatus(e, false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => submitWithStatus(e, true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
