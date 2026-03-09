"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-gray-800 text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-gray-200" />;
}

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "내용을 입력하세요",
  maxLength = 5000,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-content prose prose-sm max-w-none focus:outline-none min-h-[240px] px-4 py-3",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      if (e.state.doc.textContent.length <= maxLength) {
        onChange(html);
      }
    },
  });

  if (!editor) return null;

  const charCount = editor.state.doc.textContent.length;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="제목 (H2)"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="소제목 (H3)"
        >
          H3
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="굵게 (Ctrl+B)"
        >
          <span className="font-black">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="기울임 (Ctrl+I)"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="취소선 (Ctrl+Shift+S)"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="글머리 기호"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <title>목록</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="번호 목록"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <title>번호 목록</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="인용"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <title>인용</title>
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="구분선"
        >
          —
        </ToolbarButton>

        <div className="ml-auto text-[11px] text-gray-300">
          {charCount}/{maxLength}
        </div>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
