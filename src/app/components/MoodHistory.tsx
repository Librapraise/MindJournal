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

interface MoodHistoryListProps {
  darkMode: boolean;
}

export default function MoodHistoryList({ darkMode }: MoodHistoryListProps) {
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

  // Theme colors based on darkMode state
  const colors = {
    background: darkMode ? 'bg-gray-800' : 'bg-white',
    cardBackground: darkMode ? 'bg-gray-700' : 'bg-gray-50',
    text: darkMode ? 'text-gray-200' : 'text-gray-700',
    secondaryText: darkMode ? 'text-gray-400' : 'text-gray-600',
    borderColor: darkMode ? 'border-gray-700' : 'border-gray-200',
    selectBackground: darkMode ? 'bg-gray-700' : 'bg-white',
    errorText: darkMode ? 'text-red-400' : 'text-red-500',
    loadingText: darkMode ? 'text-gray-500' : 'text-gray-400',
    shadow: darkMode ? 'shadow-lg shadow-gray-900/20' : 'shadow-md',
    dateText: darkMode ? 'text-gray-300' : 'text-gray-600',
    scrollbarThumb: darkMode ? 'bg-gray-600' : 'bg-gray-300',
    scrollbarTrack: darkMode ? 'bg-gray-800' : 'bg-gray-100'
  };

  // Get color class based on mood with dark mode support
  const getMoodColorClass = (mood: string): string => {
    const moodLower = mood.toLowerCase();
    
    if (darkMode) {
      // Dark mode colors
      if (moodLower.includes('happy') || moodLower.includes('good')) {
        return 'bg-green-900 text-green-200';
      } else if (moodLower.includes('neutral')) {
        return 'bg-blue-900 text-blue-200';
      } else if (moodLower.includes('stressed')) {
        return 'bg-yellow-900 text-yellow-200';
      } else if (moodLower.includes('angry') || moodLower.includes('sad') || moodLower.includes('depress')) {
        return 'bg-red-900 text-red-200';
      }
      return 'bg-gray-600 text-gray-200';
    } else {
      // Light mode colors
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
    }
  };

  // Render a single mood item
  const renderMoodItem = (item: MoodDataPoint, index: number) => (
    <div 
      key={index} 
      className={`flex justify-between items-center p-3 rounded-lg ${colors.cardBackground} mb-2 hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center">
        <span className={colors.dateText}>{formatDate(item.date)}</span>
      </div>
      <div className={`px-3 py-1 rounded-full ${getMoodColorClass(item.mood)}`}>
        {item.mood}
      </div>
    </div>
  );

  return (
    <div className={`${colors.background} p-6 rounded-xl ${colors.shadow} space-y-4`}>
      {/* Title and Filter */}
      <div className="flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${colors.text}`}>Recent Moods</h2>
        <select 
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className={`text-sm border rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 
            ${colors.borderColor} ${colors.selectBackground} ${colors.text}`}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Mood History List */}
      <div>
        {isLoading ? (
          <div className={`py-6 flex items-center justify-center ${colors.loadingText}`}>
            Loading mood history...
          </div>
        ) : error ? (
          <div className={`py-6 flex items-center justify-center ${colors.errorText}`}>
            {error}
          </div>
        ) : moodData.length === 0 ? (
          <div className={`py-6 flex items-center justify-center ${colors.loadingText}`}>
            No mood data available
          </div>
        ) : (
          <div>
            {/* First 4 mood items displayed normally */}
            <div className="mb-3">
              {moodData.slice(0, 3).map((item, index) => renderMoodItem(item, index))}
            </div>
            
            {/* Remaining mood items in a scrollable div with clear visual separation */}
            {moodData.length > 3 && (
              <>
                <div className={`flex items-center mb-2 ${colors.secondaryText}`}>
                  <div className="flex-grow border-t ${colors.borderColor}"></div>
                  <span className="px-2 text-xs">Older entries</span>
                  <div className="flex-grow border-t ${colors.borderColor}"></div>
                </div>
                
                <div 
                  className={`overflow-y-auto max-h-64 pr-1 rounded-lg ${
                    darkMode ? 'scrollbar-dark' : 'scrollbar-light'
                  }`}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${darkMode ? '#4B5563 #1F2937' : '#D1D5DB #F3F4F6'}`
                  }}
                >
                  {moodData.slice(3).map((item, index) => renderMoodItem(item, index + 3))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Add custom scrollbar styles */}
      <style jsx global>{`

      `}</style>
    </div>
  );
}