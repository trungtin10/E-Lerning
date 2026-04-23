import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, List,
  ListOrdered, Quote, Heading1, Heading2, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, Type, ChevronDown,
  Grid3X3, MousePointer2, FileSpreadsheet, Layers, Loader2,
  AlignCenter, AlignLeft, AlignRight, Maximize, Minimize
} from 'lucide-react';
import api from '../../api/axios';

// Extend Image extension to support sizing and alignment
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; max-width: 100%;`
        })
      },
      textAlign: {
        default: 'left',
        renderHTML: attributes => ({
          style: `display: block; margin-left: ${attributes.textAlign === 'center' || attributes.textAlign === 'right' ? 'auto' : '0'}; margin-right: ${attributes.textAlign === 'center' || attributes.textAlign === 'left' ? 'auto' : '0'};`
        })
      }
    }
  }
})

const MenuBar = ({ editor }) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 0, c: 0 });
  const [uploading, setUploading] = useState(false);
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const url = response.data.url;
      const fullUrl = url.startsWith('http') ? url : api.defaults.baseURL.replace(/\/api\/?$/, '') + url;
      
      editor.chain().focus().setImage({ src: fullUrl, width: '50%' }).run();
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setLink = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const createTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTablePicker(false);
  };

  const updateImageSize = (delta) => {
    const attrs = editor.getAttributes('image');
    if (!attrs.src) return;
    
    let currentWidth = attrs.width || '100%';
    let numericWidth = parseInt(currentWidth);
    if (isNaN(numericWidth)) numericWidth = 100;
    
    const newWidth = Math.max(10, Math.min(100, numericWidth + delta));
    editor.chain().focus().updateAttributes('image', { width: `${newWidth}%` }).run();
  };

  const setTextAlign = (align) => {
    if (editor.isActive('image')) {
      editor.chain().focus().updateAttributes('image', { textAlign: align }).run();
    } else {
      editor.chain().focus().setTextAlign(align).run();
    }
  };

  const TableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
  );

  return (
    <div className="d-flex flex-wrap gap-1 p-2 border-bottom bg-light rounded-top-4 sticky-top" style={{ top: 0, zIndex: 100 }}>
      {/* Basic Styles */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-sm ${editor.isActive('bold') ? 'btn-primary' : 'btn-white border'}`} title="Chữ đậm"><Bold size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-sm ${editor.isActive('italic') ? 'btn-primary' : 'btn-white border'}`} title="Chữ nghiêng"><Italic size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-sm ${editor.isActive('underline') ? 'btn-primary' : 'btn-white border'}`} title="Gạch chân"><UnderlineIcon size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`btn btn-sm ${editor.isActive('strike') ? 'btn-primary' : 'btn-white border'}`} title="Gạch ngang"><Type size={16} style={{ textDecoration: 'line-through' }} /></button>

      <div className="vr mx-1"></div>

      {/* Alignment */}
      <button type="button" onClick={() => setTextAlign('left')} className={`btn btn-sm ${editor.isActive({ textAlign: 'left' }) ? 'btn-primary' : 'btn-white border'}`} title="Căn trái"><AlignLeft size={16} /></button>
      <button type="button" onClick={() => setTextAlign('center')} className={`btn btn-sm ${editor.isActive({ textAlign: 'center' }) ? 'btn-primary' : 'btn-white border'}`} title="Căn giữa"><AlignCenter size={16} /></button>
      <button type="button" onClick={() => setTextAlign('right')} className={`btn btn-sm ${editor.isActive({ textAlign: 'right' }) ? 'btn-primary' : 'btn-white border'}`} title="Căn phải"><AlignRight size={16} /></button>

      <div className="vr mx-1"></div>

      {/* Image resizing (if image selected) */}
      {editor.isActive('image') && (
        <>
          <button type="button" onClick={() => updateImageSize(10)} className="btn btn-sm btn-white border text-primary" title="Phóng to ảnh"><Maximize size={16} /></button>
          <button type="button" onClick={() => updateImageSize(-10)} className="btn btn-sm btn-white border text-primary" title="Thu nhỏ ảnh"><Minimize size={16} /></button>
          <div className="vr mx-1"></div>
        </>
      )}

      {/* Headings */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 1 }) ? 'btn-primary' : 'btn-white border'}`} title="Tiêu đề 1"><Heading1 size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 2 }) ? 'btn-primary' : 'btn-white border'}`} title="Tiêu đề 2"><Heading2 size={16} /></button>

      <div className="vr mx-1"></div>

      {/* Lists */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn btn-sm ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-white border'}`} title="Danh sách chấm"><List size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`btn btn-sm ${editor.isActive('orderedList') ? 'btn-primary' : 'btn-white border'}`} title="Danh sách số"><ListOrdered size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`btn btn-sm ${editor.isActive('blockquote') ? 'btn-primary' : 'btn-white border'}`} title="Trích dẫn"><Quote size={16} /></button>

      <div className="vr mx-1"></div>

      {/* Insertables */}
      <button type="button" onClick={setLink} className={`btn btn-sm ${editor.isActive('link') ? 'btn-primary' : 'btn-white border'}`} title="Chèn liên kết"><LinkIcon size={16} /></button>
      
      <input type="file" className="d-none" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} />
      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()} 
        className="btn btn-sm btn-white border" 
        title="Tải ảnh lên" 
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
          </svg>
        )}
      </button>

      <div className="position-relative" ref={pickerRef}>
        <button type="button" onClick={() => setShowTablePicker(!showTablePicker)} className={`btn btn-sm btn-white border d-flex align-items-center gap-1 ${showTablePicker ? 'text-primary border-primary' : ''}`} title="Chèn bảng">
          <TableIcon /><ChevronDown size={12} />
        </button>
        {showTablePicker && (
          <div className="position-absolute bg-white shadow-lg border rounded-3 p-0 mt-1 overflow-hidden" style={{ top: '100%', left: 0, minWidth: '220px', zIndex: 1000 }}>
            <div className="p-3 border-bottom bg-white">
              <div className="fw-bold small mb-2 text-dark">{hoverGrid.r > 0 ? `${hoverGrid.c}x${hoverGrid.r} Table` : 'Select grid'}</div>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' }}>
                {Array.from({ length: 10 }).map((_, r) => Array.from({ length: 10 }).map((_, c) => {
                    const row = r + 1; const col = c + 1; const isActive = row <= hoverGrid.r && col <= hoverGrid.c;
                    return (
                      <div key={`${r}-${c}`} onMouseEnter={() => setHoverGrid({ r: row, c: col })} onClick={() => createTable(row, col)}
                        style={{ width: '18px', height: '18px', border: `1px solid ${isActive ? '#fb923c' : '#e2e8f0'}`, backgroundColor: isActive ? '#fff7ed' : 'transparent', cursor: 'pointer' }}
                      />
                    );
                }))}
              </div>
            </div>
            <div className="p-1">
              <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-3 small border-0 bg-transparent w-100 text-start hover-bg-light" onClick={() => createTable(3, 3)}>
                <Grid3X3 size={16} className="text-secondary" /> <span>Insert Table...</span>
              </button>
              <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-3 small border-0 bg-transparent w-100 text-start hover-bg-light" onClick={() => createTable(1, 1)}>
                <MousePointer2 size={16} className="text-secondary" /> <span>Draw Table</span>
              </button>
              <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-3 small border-0 bg-transparent w-100 text-start hover-bg-light">
                <FileSpreadsheet size={16} className="text-success" /> <span>Excel Spreadsheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ms-auto d-flex gap-1">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className="btn btn-sm btn-white border" title="Hoàn tác"><Undo size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className="btn btn-sm btn-white border" title="Làm lại"><Redo size={16} /></button>
      </div>
    </div>
  );
};

const TiptapEditor = ({ content, onChange }) => {
  const isFirstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      CustomImage.configure({ inline: true, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content p-3 focus-none',
        style: 'min-height: 300px; outline: none;',
        spellcheck: 'false',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      if (isFirstRender.current || !editor.isFocused) {
        editor.commands.setContent(content);
        isFirstRender.current = false;
      }
    }
  }, [content, editor]);

  return (
    <div className="tiptap-wrapper border-2 rounded-4 bg-white overflow-hidden shadow-sm" style={{ borderColor: '#e2e8f0' }}>
      <MenuBar editor={editor} />
      <div className="bg-white" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap-content { font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #1e293b; }
        .tiptap-content p.is-editor-empty:first-child::before {
          content: "Bắt đầu soạn thảo...";
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #64748b; font-style: italic; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; transition: all 0.2s; cursor: pointer; }
        .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; }
        .ProseMirror table td, .ProseMirror table th { min-width: 1em; border: 1.5px solid #cbd5e1; padding: 10px 12px; vertical-align: top; box-sizing: border-box; position: relative; }
        .ProseMirror table th { font-weight: bold; text-align: left; background-color: #f8fafc; }
        .btn-white { background: white; }
        .btn-white:hover { border-color: #3b82f6 !important; color: #3b82f6; }
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
