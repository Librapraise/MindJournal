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

export default function RecentEntries() {
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Recent Entries</h3>
        <a href="/journal" className="text-sm text-blue-600 hover:text-blue-800">See All</a>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4 text-gray-500">
          Loading entries...
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.length ? entries.map((entry: JournalEntry) => (
            <div key={entry.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition duration-200">
              {/* Date badge */}
              <div className="flex-shrink-0 bg-blue-100 rounded-md text-center p-2 w-12">
                <div className="text-blue-700 font-bold">
                  {new Date(entry.created_at).getDate()}
                </div>
                <div className="text-blue-600 text-xs">
                  {new Date(entry.created_at).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              
              {/* Entry info */}
              <div className="flex-grow border-l border-gray-300 pl-4">
                <h4 className="font-bold text-gray-800">
                  {entry.title || new Date(entry.created_at).toLocaleDateString()}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {createSnippet(entry.content)}
                </p>
              </div>
              
              {/* Mood emoji */}
              <div className="flex-shrink-0 text-xl bg-gray-100 rounded-full p-2 text-center w-10 h-10 flex items-center justify-center">
                {getMoodEmoji(entry)}
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              No entries yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
