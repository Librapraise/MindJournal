"use client";

import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Loader2, Calendar, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/ThemeContext'; 

export default function JournalEntries() {
  const { theme, toggleTheme } = useTheme();
  const [entries, setEntries] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  const isDark = theme === 'dark';

  // Fetch all journal entries on component mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://mentalheathapp.vercel.app/journal', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
      setError('Failed to load journal entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    setDeleteLoading(entryId);
    
    try {
      const response = await fetch(`https://mentalheathapp.vercel.app/journal/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Remove deleted entry from state
      setEntries(entries.filter(entry => entry.id !== entryId));
    } catch (err) {
      console.error(`Failed to delete entry ${entryId}:`, err);
      setError(`Failed to delete entry. Please try again.`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return isDark ? 'bg-gray-700' : 'bg-gray-200';
    
    switch(sentiment.toLowerCase()) {
      case 'positive':
        return isDark ? 'bg-green-800 text-green-100' : 'bg-green-200';
      case 'negative':
        return isDark ? 'bg-red-800 text-red-100' : 'bg-red-200';
      case 'neutral':
        return isDark ? 'bg-blue-800 text-blue-100' : 'bg-blue-200';
      case 'mixed':
        return isDark ? 'bg-purple-800 text-purple-100' : 'bg-purple-200';
      default:
        return isDark ? 'bg-gray-700' : 'bg-gray-200';
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
    <div className={`min-h-screen w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-72 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Journal Entries</h1>
        </div>
        <button 
          onClick={toggleTheme} 
          className={`cursor-pointer p-2 rounded-full ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-700'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className={`animate-spin h-8 w-8 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
          <span className="ml-2">Loading entries...</span>
        </div>
      )}

      {error && (
        <div className={`${isDark ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-md p-4 mb-4 flex items-start`}>
          <AlertCircle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-500'} mr-2 mt-0.5`} />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-10">
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>You haven't created any journal entries yet.</p>
          <button className={`px-4 py-2 ${isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md`}>
            Create Your First Entry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {entries.map(entry => (
          <div 
            key={entry.id} 
            className={`${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`flex justify-between items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} px-4 py-3 border-b`}>
              <div className="flex items-center">
                <Calendar size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(entry.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                {entry.sentiment_label && (
                  <span className={`${getSentimentColor(entry.sentiment_label)} text-xs px-2 py-1 rounded-full`}>
                    {entry.sentiment_label}
                  </span>
                )}
                <button 
                  onClick={() => deleteEntry(entry.id)}
                  disabled={deleteLoading === entry.id}
                  className={`cursor-pointer ${isDark 
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'} 
                    p-1 rounded-full`}
                >
                  {deleteLoading === entry.id ? 
                    <Loader2 className="animate-spin h-4 w-4" /> : 
                    <Trash2 size={16} />
                  }
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap`}>
                {createSnippet(entry.content)}
              </p>
            </div>
            {entry.themes && entry.themes.length > 0 && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {entry.themes.map((theme: string, idx: number) => (
                    <span 
                      key={idx} 
                      className={`${isDark 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-600'} 
                        text-xs px-2 py-1 rounded-full`}
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}