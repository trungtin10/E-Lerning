import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Underline as UnderlineIcon, List,
  ListOrdered, Quote, Heading1, Heading2, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="d-flex flex-wrap gap-1 p-2 border-bottom bg-light rounded-top-4">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-sm ${editor.isActive('bold') ? 'btn-primary' : 'btn-white border'}`}><Bold size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-sm ${editor.isActive('italic') ? 'btn-primary' : 'btn-white border'}`}><Italic size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-sm ${editor.isActive('underline') ? 'btn-primary' : 'btn-white border'}`}><UnderlineIcon size={16} /></button>
      <div className="vr mx-1"></div>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 1 }) ? 'btn-primary' : 'btn-white border'}`}><Heading1 size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 2 }) ? 'btn-primary' : 'btn-white border'}`}><Heading2 size={16} /></button>
      <div className="vr mx-1"></div>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn btn-sm ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-white border'}`}><List size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`btn btn-sm ${editor.isActive('orderedList') ? 'btn-primary' : 'btn-white border'}`}><ListOrdered size={16} /></button>
      <div className="vr mx-1"></div>
      <button type="button" onClick={setLink} className={`btn btn-sm ${editor.isActive('link') ? 'btn-primary' : 'btn-white border'}`}><LinkIcon size={16} /></button>
      <button type="button" onClick={addImage} className="btn btn-sm btn-white border"><ImageIcon size={16} /></button>
      <div className="ms-auto d-flex gap-1">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className="btn btn-sm btn-white border"><Undo size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className="btn btn-sm btn-white border"><Redo size={16} /></button>
      </div>
    </div>
  );
};

const TiptapEditor = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'form-control rounded-bottom-4 p-4 min-vh-20 focus-none border-top-0',
        style: 'min-height: 250px; outline: none;',
        spellcheck: 'false',
      },
    },
  });

  // Cập nhật nội dung khi activeItem thay đổi
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="tiptap-wrapper border rounded-4 shadow-sm bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { min-height: 250px; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; }
        .btn-white { background: white; }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
