"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import JournalHeader from '../components/journal/JournalHeader';
import JournalEditor from '../components/journal/JournalEditor';
import MoodSelector from '../components/journal/MoodSelector';
import MoodRatingSlider from '../components/journal/MoodRatingSlider';
import TagManager from '../components/journal/TagManager';
import WritingPrompts from '../components/journal/WritingPrompts';
import InsightsCard from '../components/journal/InsightsCard';
import { TimeOfDay, Mood, JournalEntryCreate } from '@/app/types';
import { useTheme } from '@/app/ThemeContext'; // Import the theme hook

const API_URL = 'https://mentalheathapp.vercel.app/journal';

const JournalPage: React.FC = () => {
  const { darkMode, toggleTheme } = useTheme(); // Correctly destructure from useTheme

  const [entry, setEntry] = useState<Omit<JournalEntryCreate, 'mood' | 'is_draft'>>({
    title: '',
    content: '',
    date: format(new Date(), 'dd/MM/yyyy'),
    time_of_day: 'Afternoon',
    tags: [],
  });
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodRating, setMoodRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editor, setEditor] = useState<{ commands: { setContent: (content: string) => void } } | null>(null);

  const updateEntryField = (field: string, value: any) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  const saveJournalEntry = async (isDraft: boolean = false) => {
    if (!entry.title) {
      setApiError('Please add a title for your journal entry');
      return;
    }

    if (!entry.content.trim()) {
      setApiError('Please enter some content for your journal entry');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const cleanPayload = {
        title: String(entry.title),
        content: String(entry.content),
        date: String(entry.date),
        time_of_day: String(entry.time_of_day),
        tags: Array.isArray(entry.tags) ? entry.tags.map(tag => String(tag)) : [],
        mood: selectedMood ? String(selectedMood) : undefined,
        mood_rating: Number(moodRating),
        is_draft: Boolean(isDraft),
      };

      const token = localStorage.getItem('token') || 'mock-token-123';
      const jsonBody = JSON.stringify(cleanPayload);
      console.log('Clean payload:', jsonBody);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonBody,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      setSuccessMessage(isDraft ? 'Journal draft saved successfully!' : 'Journal entry saved successfully!');

      if (!isDraft) {
        setEntry({
          title: '',
          content: '',
          date: format(new Date(), 'dd/MM/yyyy'),
          time_of_day: 'Afternoon',
          tags: [],
        });
        setSelectedMood(null);
        setMoodRating(5);

        if (editor) {
          try {
            if (editor.commands && typeof editor.commands.setContent === 'function') {
              editor.commands.setContent('');
            }
          } catch (editorError) {
            console.error('Failed to clear editor:', editorError);
          }
        }
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      console.error('Failed to save journal entry:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to save journal entry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`flex-1 p-6 lg:pl-72 space-y-6 overflow-auto min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-black'
    }`}>
      <JournalHeader
        isSubmitting={isSubmitting}
        onSave={saveJournalEntry}
        onSaveDraft={() => saveJournalEntry(true)}
        darkMode={darkMode}
        toggleDarkMode={toggleTheme} // Use toggleTheme instead of a setter function
      />

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {apiError}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`w-full md:w-2/3 rounded-lg shadow p-6 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <JournalEditor
            entry={entry}
            updateEntry={updateEntryField}
            setEditor={setEditor}
            darkMode={darkMode}
          />
        </div>

        <div className="w-full md:w-1/3 space-y-6">
          <MoodSelector selectedMood={selectedMood} setSelectedMood={setSelectedMood} darkMode={darkMode}/>
          <MoodRatingSlider moodRating={moodRating} setMoodRating={setMoodRating} isSubmitting={isSubmitting} darkMode={darkMode}/>
          <TagManager tags={entry.tags} updateTags={(tags: string[]) => updateEntryField('tags', tags)} darkMode={darkMode}/>
          <WritingPrompts editor={editor} darkMode={darkMode}/>
          <InsightsCard darkMode={darkMode}/>
        </div>
      </div>
    </main>
  );
};

export default JournalPage;