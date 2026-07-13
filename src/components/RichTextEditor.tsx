'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md">Loading Editor...</div>,
});

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const modules = {
  toolbar: [
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
};

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
          className="text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          {isHtmlMode ? 'Switch to Visual Editor' : 'Switch to HTML Editor'}
        </button>
      </div>

      {isHtmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="<p>Enter your HTML here...</p>"
        />
      ) : (
        <div className="bg-white rounded-md quill-wrapper">
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
