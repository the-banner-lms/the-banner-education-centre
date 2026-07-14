'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { uploadBlogImage } from '@/utils/supabase/storage';

const ReactQuill = dynamic(
  async () => {
    const rqModule = await import('react-quill-new');
    const RQ = rqModule.default;
    const Quill = rqModule.Quill;

    if (Quill) {
      const Font = Quill.import('formats/font') as any;
      Font.whitelist = ['arial', 'georgia', 'times-new-roman', 'courier-new', 'noto-sans-myanmar'];
      Quill.register(Font, true);

      const Size = Quill.import('formats/size') as any;
      Size.whitelist = ['small', false, 'medium', 'large', 'huge'];
      Quill.register(Size, true);

      const Parchment = Quill.import('parchment') as any;
      const LineHeight = new Parchment.StyleAttributor('lineheight', 'line-height', {
        scope: Parchment.Scope.BLOCK,
        whitelist: ['1', '1.15', '1.5', '2'],
      });
      Quill.register(LineHeight, true);

      if (typeof window !== 'undefined') {
        (window as any).Quill = Quill;
        const imageResizeModule = await import('quill-image-resize-module-react');
        Quill.register('modules/imageResize', imageResizeModule.default);
      }

      const Break = Quill.import('blots/break');
      const Embed = Quill.import('blots/embed');
      class SmartBreak extends (Break as any) {
        length() { return 1; }
        value() { return '\n'; }
        insertInto(parent: any, ref: any) {
          (Embed as any).prototype.insertInto.call(this, parent, ref);
        }
      }
      (SmartBreak as any).blotName = 'break';
      (SmartBreak as any).tagName = 'BR';
      Quill.register(SmartBreak);
    }

    return function ForwardedQuill(props: any) {
      return <RQ ref={props.forwardedRef} {...props} />;
    };
  },
  {
    ssr: false,
    loading: () => <div className="flex h-64 items-center justify-center rounded-md border border-gray-300 bg-gray-50">Loading Editor...</div>,
  }
);

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  draftKey?: string;
}

type StoredDraft = {
  content: string;
  updatedAt: string;
};

const formats = [
  'header', 'font', 'size', 'lineheight',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'color', 'background',
  'align', 'direction',
  'list', 'script', 'indent',
  'link', 'image', 'video',
];

export default function RichTextEditor({
  label = 'Main Content',
  value,
  onChange,
  required = false,
  draftKey,
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [draftChecked, setDraftChecked] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<StoredDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState('');
  const reactQuillRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(value);
  const storageKey = draftKey ? `banner-editor-draft:${draftKey}` : null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !storageKey) {
      setDraftChecked(true);
      return;
    }

    try {
      const rawDraft = localStorage.getItem(storageKey);
      if (rawDraft) {
        const stored = JSON.parse(rawDraft) as StoredDraft;
        if (stored.content && stored.content !== initialValueRef.current) {
          setRecoveredDraft(stored);
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
    setDraftChecked(true);
  }, [mounted, storageKey]);

  useEffect(() => {
    if (!mounted || !storageKey || !draftChecked || recoveredDraft) return;

    setDraftStatus('Saving locally...');
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ content: value, updatedAt: new Date().toISOString() }));
      setDraftStatus('Saved locally');
    }, 800);

    return () => window.clearTimeout(timer);
  }, [draftChecked, mounted, recoveredDraft, storageKey, value]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (value !== initialValueRef.current && value !== '<p><br></p>') {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [value]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isFullscreen]);

  const insertImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadBlogImage(file);
      const quill = reactQuillRef.current?.getEditor?.();
      if (!publicUrl || !quill) throw new Error('Upload failed');

      const range = quill.getSelection(true);
      const index = range ? range.index : Math.max(0, quill.getLength() - 1);
      quill.insertEmbed(index, 'image', publicUrl, 'user');
      quill.setSelection(index + 1, 0, 'silent');
      onChange(quill.root.innerHTML);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void insertImageFile(file);
    };
    input.click();
  }, [insertImageFile]);

  useEffect(() => {
    if (!mounted || isHtmlMode) return;
    let editorRoot: HTMLElement | null = null;

    const pasteHandler = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith('image/'));
      const file = imageItem?.getAsFile();
      if (file) {
        event.preventDefault();
        void insertImageFile(file);
      }
    };

    const dropHandler = (event: DragEvent) => {
      const file = Array.from(event.dataTransfer?.files || []).find(item => item.type.startsWith('image/'));
      if (file) {
        event.preventDefault();
        void insertImageFile(file);
      }
    };

    const timer = window.setInterval(() => {
      editorRoot = reactQuillRef.current?.getEditor?.()?.root || null;
      if (!editorRoot) return;
      window.clearInterval(timer);
      editorRoot.addEventListener('paste', pasteHandler);
      editorRoot.addEventListener('drop', dropHandler);
    }, 150);

    return () => {
      window.clearInterval(timer);
      editorRoot?.removeEventListener('paste', pasteHandler);
      editorRoot?.removeEventListener('drop', dropHandler);
    };
  }, [insertImageFile, isHtmlMode, mounted]);

  useEffect(() => {
    if (!mounted || isHtmlMode) return;
    const titles: Record<string, string> = {
      'ql-undo': 'Undo (Ctrl/Cmd + Z)',
      'ql-redo': 'Redo (Ctrl/Cmd + Shift + Z)',
      'ql-bold': 'Bold',
      'ql-italic': 'Italic',
      'ql-underline': 'Underline',
      'ql-strike': 'Strikethrough',
      'ql-color': 'Text color',
      'ql-background': 'Highlight color',
      'ql-align': 'Text alignment',
      'ql-direction': 'Text direction',
      'ql-list': 'List',
      'ql-indent': 'Indent',
      'ql-script': 'Subscript or superscript',
      'ql-blockquote': 'Block quote',
      'ql-code-block': 'Code block',
      'ql-link': 'Insert link',
      'ql-image': 'Upload image',
      'ql-video': 'Insert video',
      'ql-clean': 'Clear formatting',
    };

    const timer = window.setInterval(() => {
      const toolbar = shellRef.current?.querySelector('.ql-toolbar');
      if (!toolbar) return;
      window.clearInterval(timer);
      toolbar.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
        const matchingClass = Array.from(button.classList).find(className => titles[className]);
        if (matchingClass) button.title = titles[matchingClass];
      });
      toolbar.querySelectorAll<HTMLElement>('.ql-picker').forEach(picker => {
        if (picker.classList.contains('ql-header')) picker.title = 'Paragraph style';
        if (picker.classList.contains('ql-font')) picker.title = 'Font';
        if (picker.classList.contains('ql-size')) picker.title = 'Font size';
        if (picker.classList.contains('ql-lineheight')) picker.title = 'Line spacing';
      });
    }, 150);

    return () => window.clearInterval(timer);
  }, [isHtmlMode, mounted]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['undo', 'redo'],
        [{ header: [1, 2, 3, 4, false] }, { font: ['arial', 'georgia', 'times-new-roman', 'courier-new', 'noto-sans-myanmar'] }, { size: ['small', false, 'medium', 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }, { direction: 'rtl' }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ lineheight: ['1', '1.15', '1.5', '2'] }],
        [{ script: 'sub' }, { script: 'super' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
        undo(this: any) { this.quill.history.undo(); },
        redo(this: any) { this.quill.history.redo(); },
      },
    },
    history: { delay: 800, maxStack: 200, userOnly: true },
    keyboard: {
      bindings: {
        handleEnter: {
          key: 13,
          shiftKey: false,
          handler(this: any, range: any, context: any) {
            if (context.format.list) return true;
            this.quill.insertEmbed(range.index, 'break', true, 'user');
            this.quill.setSelection(range.index + 1, 0, 'silent');
            return false;
          },
        },
      },
    },
    imageResize: {
      parchment: typeof window !== 'undefined' ? (window as any).Quill?.import('parchment') : null,
      modules: ['Resize', 'DisplaySize'],
    },
  }), [imageHandler]);

  const plainText = useMemo(() => value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim(), [value]);
  const wordCount = plainText ? plainText.split(' ').filter(Boolean).length : 0;
  const characterCount = plainText.length;

  const saveDraftNow = useCallback(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ content: value, updatedAt: new Date().toISOString() }));
    setDraftStatus('Saved locally');
  }, [storageKey, value]);

  useEffect(() => {
    const keyboardSave = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && shellRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        saveDraftNow();
      }
      if (event.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener('keydown', keyboardSave);
    return () => document.removeEventListener('keydown', keyboardSave);
  }, [isFullscreen, saveDraftNow]);

  const findNext = () => {
    const quill = reactQuillRef.current?.getEditor?.();
    if (!quill || !findText) return;
    const text = quill.getText();
    const selection = quill.getSelection();
    const startIndex = selection ? selection.index + selection.length : 0;
    let matchIndex = text.toLocaleLowerCase().indexOf(findText.toLocaleLowerCase(), startIndex);
    if (matchIndex < 0) matchIndex = text.toLocaleLowerCase().indexOf(findText.toLocaleLowerCase());
    if (matchIndex >= 0) {
      quill.setSelection(matchIndex, findText.length, 'user');
      quill.focus();
    } else {
      alert('Text not found.');
    }
  };

  const replaceAll = () => {
    const quill = reactQuillRef.current?.getEditor?.();
    if (!quill || !findText) return;
    const text = quill.getText();
    const haystack = text.toLocaleLowerCase();
    const needle = findText.toLocaleLowerCase();
    const matches: number[] = [];
    let index = haystack.indexOf(needle);
    while (index >= 0) {
      matches.push(index);
      index = haystack.indexOf(needle, index + needle.length);
    }
    matches.reverse().forEach(matchIndex => {
      quill.deleteText(matchIndex, findText.length, 'user');
      quill.insertText(matchIndex, replaceText, 'user');
    });
    onChange(quill.root.innerHTML);
    alert(`${matches.length} replacement${matches.length === 1 ? '' : 's'} completed.`);
  };

  if (!mounted) return null;

  return (
    <div
      ref={shellRef}
      className={`editor-shell flex w-full flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-[100] overflow-y-auto p-3 sm:p-6' : 'relative'}`}
    >
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {isUploading && <span className="font-medium text-orange-600 animate-pulse">Uploading image...</span>}
          {storageKey && <span className="text-xs text-gray-500">{draftStatus}</span>}
          <button type="button" onClick={() => setShowFindReplace(value => !value)} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">Find</button>
          <button type="button" onClick={() => setIsPreviewOpen(true)} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">Preview</button>
          <button type="button" onClick={() => setIsHtmlMode(value => !value)} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
            {isHtmlMode ? 'Visual' : 'HTML'}
          </button>
          <button type="button" onClick={() => setIsFullscreen(value => !value)} className="rounded-md bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-700">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {recoveredDraft && (
        <div className="mb-3 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Unsaved local draft found from {new Date(recoveredDraft.updatedAt).toLocaleString()}.</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => { onChange(recoveredDraft.content); setRecoveredDraft(null); setDraftStatus('Draft restored'); }} className="rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white">Restore</button>
            <button type="button" onClick={() => { if (storageKey) localStorage.removeItem(storageKey); setRecoveredDraft(null); setDraftStatus('Old draft discarded'); }} className="rounded-md border border-amber-400 px-3 py-1.5 font-semibold">Discard</button>
          </div>
        </div>
      )}

      {showFindReplace && !isHtmlMode && (
        <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input value={findText} onChange={event => setFindText(event.target.value)} placeholder="Find text" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <input value={replaceText} onChange={event => setReplaceText(event.target.value)} placeholder="Replace with" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <button type="button" onClick={findNext} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold">Find next</button>
          <button type="button" onClick={replaceAll} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Replace all</button>
        </div>
      )}

      {isHtmlMode ? (
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          className={`w-full rounded-md border border-gray-300 p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${isFullscreen ? 'min-h-[70vh]' : 'min-h-[420px]'}`}
          placeholder="<p>Enter your HTML here...</p>"
        />
      ) : (
        <div className={`quill-wrapper rounded-md bg-white ${isUploading ? 'pointer-events-none opacity-80' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}>
          <ReactQuill
            forwardedRef={reactQuillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder="Start writing your content here... You can paste or drag images directly into the editor."
          />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>{wordCount} words · {characterCount} characters</span>
        <span>Ctrl/Cmd + S saves locally · Esc exits fullscreen</span>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-gray-950/70 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Content preview">
          <div className="mx-auto max-w-4xl rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
              <h2 className="font-bold text-gray-900">Content Preview</h2>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Close</button>
            </div>
            <article className="prose prose-lg max-w-none p-5 sm:p-8" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        </div>
      )}
    </div>
  );
}
