// components/JournalEditor.tsx
import React from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TimeOfDay } from '@/app/types'; // Adjust the import path as necessary
import { 
  Bold, Italic, Underline as UnderlineIcon, List, Link as LinkIcon, Minus
} from 'lucide-react';

interface JournalEditorProps {
  entry: {
    title: string;
    content: string;
    date: string;
    time_of_day: TimeOfDay;
  };
  updateEntry: (field: string, value: any) => void;
  setEditor: (editor: any) => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ entry, updateEntry, setEditor }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link
    ],
    content: '',
    onUpdate: ({ editor }) => {
      updateEntry('content', editor.getHTML());
    }
  });

  // Set the editor in the parent component
  React.useEffect(() => {
    if (editor) {
      setEditor(editor);
    }
  }, [editor, setEditor]);

  // Editor toolbar component
  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className="flex items-center space-x-2 mb-4 border-b pb-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-1 rounded ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1 rounded text-gray-600"
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Date and time section */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Date:</span>
          <input
            type="text"
            value={entry.date}
            onChange={(e) => updateEntry('date', e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-0 focus:outline-none text-sm"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div>
          <select
            value={entry.time_of_day}
            onChange={(e) => updateEntry('time_of_day', e.target.value)}
            className="border border-gray-300 rounded-md p-2 bg-transparent text-gray-800 focus:ring-0 text-sm"
          >
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
          </select>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={entry.title}
          onChange={(e) => updateEntry('title', e.target.value)}
          placeholder="How I'm feeling today..."
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none sm:text-sm"
        />
      </div>

      {/* Editor */}
      <div className="prose max-w-none">
        <EditorToolbar />
        <EditorContent 
          editor={editor} 
          className="min-h-[250px] border border-gray-300 rounded-md p-4 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" 
          placeholder='Write your journal entry here...'
        />
      </div>
    </>
  );
};

export default JournalEditor;