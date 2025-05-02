'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface JournalEntry {
  id: number;
  created_at: string; // API returns created_at, not date
  content: string; // Full content instead of snippet
  title: string; // Title from journal page
  sentiment_score?: number; // For mood indication
  sentiment_label?: string; // For mood emoji
}

interface RecentEntriesProps {
  darkMode: boolean;
}

export default function RecentEntries({ darkMode }: RecentEntriesProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios.get('https://mentalheathapp.vercel.app/journal/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
      },
      params: {
        limit: 5 // Limit to 5 most recent entries
      }
    })
      .then(res => {
        // API returns the entries directly, not wrapped in an entries property
        setEntries(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching journal entries:", err);
        setError("Failed to load recent entries");
        setIsLoading(false);
      });
  }, []);

  // Helper function to get mood emoji based on sentiment
  const getMoodEmoji = (entry: JournalEntry) => {
    if (!entry.sentiment_label) return '😐';
    
    switch(entry.sentiment_label.toLowerCase()) {
      case 'positive':
      case 'very positive':
        return '😊';
      case 'negative':
      case 'very negative':
        return '😔';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

  // Helper to create a clean text snippet from HTML content
  const createSnippet = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    
    // Remove HTML tags to get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className={`rounded-lg p-4 shadow-md ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Recent Entries</h3>
        <a href="/journal" className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>See All</a>
      </div>
      
      {isLoading ? (
        <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading entries...
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.length ? entries.map((entry: JournalEntry) => (
            <div 
              key={entry.id} 
              className={`flex items-center space-x-4 p-4 rounded-lg shadow-sm transition duration-200 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Date badge */}
              <div className={`flex-shrink-0 rounded-md text-center p-2 w-12 ${
                darkMode ? 'bg-blue-900' : 'bg-blue-100'
              }`}>
                <div className={`font-bold ${
                  darkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  {new Date(entry.created_at).getDate()}
                </div>
                <div className={`text-xs ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {new Date(entry.created_at).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              
              {/* Entry info */}
              <div className={`flex-grow pl-4 border-l ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <h4 className={`font-bold ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {entry.title || new Date(entry.created_at).toLocaleDateString()}
                </h4>
                <p className={`text-sm mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {createSnippet(entry.content)}
                </p>
              </div>
              
              {/* Mood emoji */}
              <div className={`flex-shrink-0 text-xl rounded-full p-2 text-center w-10 h-10 flex items-center justify-center ${
                darkMode ? 'bg-gray-600' : 'bg-gray-100'
              }`}>
                {getMoodEmoji(entry)}
              </div>
            </div>
          )) : (
            <div className={`text-center py-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No entries yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}