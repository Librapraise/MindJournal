'use client';

import { useEffect, useState } from 'react';

interface MoodDataPoint {
  date: string;
  mood: string;
}

interface MoodHistory {
  data: MoodDataPoint[];
}

interface HistoricalInsights {
  mood_history_7d?: MoodHistory | null;
  mood_history_30d?: MoodHistory | null;
}

export default function MoodHistoryList() {
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    const fetchMoodData = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`https://mentalheathapp.vercel.app/journal/insights/?days_mood=${days}&days_themes=${days}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const insights: HistoricalInsights = await response.json();
        
        let moodHistoryData: MoodDataPoint[] = [];
        
        if (days <= 7 && insights.mood_history_7d && insights.mood_history_7d.data) {
          moodHistoryData = insights.mood_history_7d.data;
        } else if (insights.mood_history_30d && insights.mood_history_30d.data) {
          moodHistoryData = insights.mood_history_30d.data;
        }
        
        // Sort by date (newest first)
        moodHistoryData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setMoodData(moodHistoryData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching mood data:', err);
        setError('Failed to load mood history');
        setIsLoading(false);
      }
    };
    
    fetchMoodData();
  }, [days]);

  // Helper function to get the auth token
  const getToken = (): string => {
    return localStorage.getItem('token') || '';
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color class based on mood
  const getMoodColorClass = (mood: string): string => {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('happy') || moodLower.includes('good')) {
      return 'bg-green-100 text-green-800';
    } else if (moodLower.includes('neutral')) {
      return 'bg-blue-100 text-blue-800';
    } else if (moodLower.includes('stressed')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (moodLower.includes('angry') || moodLower.includes('sad') || moodLower.includes('depress')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Recent Moods</h2>
        <select 
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-gray-400 focus:outline-none rounded p-1"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Mood History List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-6 flex items-center justify-center text-gray-400">
            Loading mood history...
          </div>
        ) : error ? (
          <div className="py-6 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : moodData.length === 0 ? (
          <div className="py-6 flex items-center justify-center text-gray-400">
            No mood data available
          </div>
        ) : (
          <>
            {moodData.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <span className="text-gray-600">{formatDate(item.date)}</span>
                </div>
                <div className={`px-3 py-1 rounded-full ${getMoodColorClass(item.mood)}`}>
                  {item.mood}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}