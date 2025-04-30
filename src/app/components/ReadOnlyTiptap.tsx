// ReadOnlyTiptap.tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function ReadOnlyTiptap({ content }: { content: string }) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: [StarterKit],
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
