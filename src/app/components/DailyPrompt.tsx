'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface DailyPromptProps {
  darkMode: boolean;
}

export default function DailyPrompt({ darkMode }: DailyPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios.get('https://mentalheathapp.vercel.app/journal/prompt/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
      }
    })
      .then(res => {
        // The API directly returns a string, not a JSON object with a prompt property
        setPrompt(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching prompt:", err);
        setError("Failed to load today's prompt");
        setIsLoading(false);
      });
  }, []);

  // Theme colors based on darkMode state
  const colors = {
    container: darkMode ? 'bg-gray-800' : 'bg-white',
    promptCard: darkMode ? 'bg-indigo-900' : 'bg-blue-500',
    title: 'text-white', // White in both modes for good contrast against the card
    promptText: 'text-white', // White in both modes for good contrast against the card
    loadingText: darkMode ? 'text-indigo-200' : 'text-blue-100',
    errorText: darkMode ? 'text-red-300' : 'text-red-200',
    shadow: darkMode ? 'shadow-lg shadow-gray-900/30' : 'shadow-md'
  };

  return (
    <div className={`${colors.container} p-4 rounded-lg`}>
      <div className={`${colors.promptCard} p-6 rounded-xl ${colors.shadow}`}>
        <h2 className={`text-lg font-semibold mb-3 ${colors.title}`}>Today's Prompt</h2>
        {isLoading ? (
          <p className={colors.loadingText}>Loading prompt...</p>
        ) : error ? (
          <p className={colors.errorText}>{error}</p>
        ) : (
          <p className={colors.promptText}>{prompt || "No prompt available for today. Check back later!"}</p>
        )}
      </div>
    </div>
  );
}