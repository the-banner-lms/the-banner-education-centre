'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { uploadBlogImage } from '@/utils/supabase/storage';

// Dynamically import ReactQuill to avoid SSR issues
// Forward the ref properly for the dynamic component
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    // eslint-disable-next-line react/display-name
    return function ForwardedQuill(props: any) {
      return <RQ ref={props.forwardedRef} {...props} />;
    };
  },
  {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md">Loading Editor...</div>,
  }
);

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'color', 'background',
  'align',
  'list',
  'script',
  'indent',
  'link', 'image', 'video'
];

export default function RichTextEditor({ label = 'Main Content', value, onChange, required = false }: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const reactQuillRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const publicUrl = await uploadBlogImage(file);
        if (publicUrl) {
          const quill = reactQuillRef.current?.getEditor?.();
          if (quill) {
            const range = quill.getSelection(true);
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, 'image', publicUrl);
            quill.setSelection(index + 1, 0, 'silent');
            onChange(quill.root.innerHTML);
          }
        } else {
          alert('Failed to upload image. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('An error occurred while uploading the image.');
      } finally {
        setIsUploading(false);
      }
    };
  }, [onChange]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }, { size: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full relative">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-4">
          {isUploading && <span className="text-xs text-orange-500 font-medium animate-pulse">Uploading image...</span>}
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            {isHtmlMode ? 'Switch to Visual Editor' : 'Switch to HTML Editor'}
          </button>
        </div>
      </div>

      {isHtmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="<p>Enter your HTML here...</p>"
        />
      ) : (
        <div className={`bg-white rounded-md quill-wrapper ${isUploading ? 'opacity-80 pointer-events-none' : ''}`}>
          <style dangerouslySetInnerHTML={{__html: `
            .quill-wrapper .ql-container {
              min-height: 300px;
              font-size: 16px;
            }
            .quill-wrapper .ql-editor {
              min-height: 300px;
            }
          `}} />
          <ReactQuill
            forwardedRef={reactQuillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
          />
        </div>
      )}
    </div>
  );
}
