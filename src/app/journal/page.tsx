"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, Link as LinkIcon, 
  Minus, CalendarIcon, Clock, TagIcon
} from 'lucide-react';

// Type definitions aligned with API schemas
type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
type Mood = 'Happy' | 'Calm' | 'Good' | 'Neutral' | 'Unsure' | 'Sad' | 'Stressed' | 'Angry';
type WritingPrompt = {
  text: string;
  type: 'stress' | 'gratitude' | 'collaboration' | 'intentions' | string;
};

// Align with the API's JournalEntryCreate schema
interface JournalEntryCreate {
  title: string;
  content: string;
  date: string;
  time_of_day: TimeOfDay;
  mood?: Mood;
  tags: string[];
  is_draft: boolean;
}

const JournalPage: React.FC = () => {
  // States
  const [entry, setEntry] = useState<Omit<JournalEntryCreate, 'mood' | 'is_draft'>>({
    title: '',
    content: '',
    date: format(new Date(), 'dd/MM/yyyy'), // Using format shown in UI
    time_of_day: 'Afternoon',
    tags: ['work', 'stress management', 'gratitude'],
  });
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<WritingPrompt[]>([
    {
      text: 'Since you mentioned stress management, would you like to explore what specific techniques work best for you?',
      type: 'stress'
    },
    {
      text: 'How have these things you\'re grateful for impacted your broader perspective?',
      type: 'gratitude'
    },
    {
      text: 'What made your team collaboration successful today?',
      type: 'collaboration'
    },
    {
      text: 'What other self-care practices could you add to your morning routine?',
      type: 'intentions'
    }
  ]);

  // Fetch a journal prompt on component mount
  React.useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch('https://mentalheathapp.vercel.app/journal/prompt/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers as needed by your auth.get_current_user dependency
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const promptText = await response.text();
          if (promptText) {
            setSuggestions(prev => [
              {
                text: promptText,
                type: 'api-generated'
              },
              ...prev.slice(0, 3) // Keep only first 3 of the existing prompts
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching journal prompt:', error);
      }
    };
    
    fetchPrompt();
  }, []);

  // Rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link
    ],
    content: `Today I'm feeling a bit mixed. The morning started with some challenges at work, but I managed to find solutions by collaborating with my team.

I noticed that my stress levels decreased after taking a short walk during lunch break.

I've been practicing the breathing techniques I learned last week, and they seem to be helping when I feel overwhelmed. Five minutes of focused breathing really changes my perspective.

Things I'm grateful for today:
- The supportive message from my friend
- Finding time to read a few pages of my book
- The sunny weather after days of rain

Tomorrow I want to make sure I start the day with a short meditation session before checking emails.`,
    onUpdate: ({ editor }) => {
      setEntry(prev => ({ ...prev, content: editor.getHTML() }));
    }
  });

  // Moods data
  const moods: { icon: string; label: Mood }[] = [
    { icon: '😊', label: 'Happy' },
    { icon: '😌', label: 'Calm' },
    { icon: '🙂', label: 'Good' },
    { icon: '😐', label: 'Neutral' },
    { icon: '😕', label: 'Unsure' },
    { icon: '😔', label: 'Sad' },
    { icon: '😩', label: 'Stressed' },
    { icon: '😠', label: 'Angry' }
  ];

  // Button Handlers
  const saveJournalEntry = async (isDraft: boolean = false) => {
    if (!entry.title) {
      alert('Please add a title for your journal entry');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Create the API request payload based on FastAPI schema
      const entryPayload: JournalEntryCreate = {
        title: entry.title,
        content: editor?.getHTML() || entry.content,
        date: entry.date,
        time_of_day: entry.time_of_day,
        tags: entry.tags,
        mood: selectedMood || undefined,
        is_draft: isDraft
      };

      // Use the correct API endpoint from the FastAPI router
      const response = await fetch('https://mentalheathapp.vercel.app/journal/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers as needed by your auth.get_current_user dependency
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entryPayload),
      });

      if (response.ok) {
        const savedEntry = await response.json();
        alert(isDraft ? 'Draft saved successfully!' : 'Journal entry saved successfully!');
        
        // Optional: Redirect to entry view or entries list
        // window.location.href = `/journal/${savedEntry.id}`;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save journal entry');
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to save journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!entry.tags.includes(newTag.trim())) {
        setEntry(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }));
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handlePromptClick = (promptText: string) => {
    if (editor) {
      // Insert prompt at cursor position or at end
      const position = editor.state.selection.anchor;
      editor.chain().focus().insertContentAt(position, `\n\n**Reflection prompt:** ${promptText}\n\n`).run();
    }
  };

  // Editor toolbar buttons
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
    <div className="max-w-7xl mx-auto px-4 py-6 lg:pl-64">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">New Journal Entry</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => saveJournalEntry(true)}
            disabled={isSubmitting}
            className="cursor-pointer px-4 py-2 bg-white border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => saveJournalEntry(false)}
            disabled={isSubmitting}
            className="cursor-pointer px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {apiError}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Main content area */}
        <div className="w-full bg-white rounded-lg shadow p-6">
          {/* Date and time section */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Date:</span>
              <input
                type="text"
                value={entry.date}
                onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                className="border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-0 focus:outline-none text-sm"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <select
                value={entry.time_of_day}
                onChange={(e) => setEntry({ ...entry, time_of_day: e.target.value as TimeOfDay })}
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
              onChange={(e) => setEntry({ ...entry, title: e.target.value })}
              placeholder="Afternoon Reflections"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none sm:text-sm"
            />
          </div>

          {/* Editor */}
          <div className="prose max-w-none">
            <EditorToolbar />
            <EditorContent editor={editor} className="min-h-[250px] focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full space-y-6">
          {/* Mood selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-medium font-bold text-gray-700 mb-3">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-md transition ${
                    selectedMood === mood.label
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedMood(mood.label)}
                >
                  <span className="text-2xl mb-1">{mood.icon}</span>
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Tags section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <TagIcon size={16} className="text-gray-500 mr-2" />
              <h3 className="text-medium font-bold text-gray-700">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {entry.tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="cursor-pointer ml-1 text-blue-500 hover:text-blue-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags..."
                className="mt-1 block w-full border border-gray-300 p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Separate tags with commas or press Enter
              </p>
            </div>
          </div>

          {/* AI Writing Prompts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-medium font-bold text-gray-700 mb-3">AI Writing Prompts</h3>
            <div className="space-y-3">
              {suggestions.map((prompt, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md cursor-pointer transition ${
                    prompt.type === 'stress'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePromptClick(prompt.text)}
                >
                  <p className="text-sm">{prompt.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Insights Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-medium font-bold text-gray-700 mb-3">Journal Insights</h3>
            <p className="text-xs text-gray-600 mb-3">
              View patterns and trends from your journal entries
            </p>
            <a 
              href="/journal/insights"
              className="w-full inline-block text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100"
            >
              View Insights
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;