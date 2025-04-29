'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface JournalEntry {
  id: number;
  created_at: string; // API returns created_at, not date
  content: string; // Full content instead of snippet
  title?: string; // Title might not be present in API
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

  // Helper to create a snippet from content
  const createSnippet = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Recent Entries</h2>
        <a href="#" className="text-sm text-blue-500 hover:underline">See All</a>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-gray-400">Loading entries...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.length ? entries.map(entry => (
            <div key={entry.id} className="flex items-start space-x-4">
              {/* Date badge */}
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-blue-600">
                  {new Date(entry.created_at).getDate()}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleString('default', { month: 'short' })}
                </div>
              </div>

              {/* Entry info */}
              <div className="flex-1 border-b pb-3">
                <h3 className="text-gray-800 font-semibold">
                  {entry.title || new Date(entry.created_at).toLocaleDateString()}
                </h3>
                <p className="text-gray-500 text-sm">{createSnippet(entry.content)}</p>
              </div>

              {/* Mood emoji */}
              <div className="text-xl">{getMoodEmoji(entry)}</div>
            </div>
          )) : (
            <div className="text-gray-400 text-center">No entries yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
