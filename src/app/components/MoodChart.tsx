'use client';

import { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line 
} from 'recharts';

// Define the types for the API response
interface MoodDataPoint {
  date: string;
  mood: string;
}

interface MoodHistory {
  data: MoodDataPoint[];
}

interface ThemeData {
  theme: string;
  count: number;
}

interface ThemeCloud {
  data: ThemeData[];
}

interface HistoricalInsights {
  mood_history_7d?: MoodHistory | null;
  mood_history_30d?: MoodHistory | null;
  theme_cloud_30d?: ThemeCloud | null;
}
interface MoodChartProps {
  darkMode: boolean;
}

export default function MoodChart({ darkMode }: MoodChartProps) {
  const [moodData, setMoodData] = useState<{ date: string; value: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoodData = async () => {
      setIsLoading(true);
      
      // Determine which API params to use based on the active tab
      let daysParam = 30; // Default
      
      switch(activeTab) {
        case 'Day':
          daysParam = 1;
          break;
        case 'Week':
          daysParam = 7;
          break;
        case 'Month':
          daysParam = 30;
          break;
        case 'Year':
          daysParam = 90; // Using the max allowed by the API (90 days)
          break;
      }
      
      try {
        // Using the API endpoint from your FastAPI code
        const response = await fetch(`https://mentalheathapp.vercel.app/journal/insights/?days_mood=${daysParam}&days_themes=${daysParam}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // You'll need to include authorization header
            'Authorization': `Bearer ${getToken()}` // Implement getToken function
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const insights: HistoricalInsights = await response.json();
        
        // Process the mood data based on the active tab
        let moodHistoryData: MoodDataPoint[] = [];
        
        if (activeTab === 'Week' && insights.mood_history_7d && insights.mood_history_7d.data) {
          moodHistoryData = insights.mood_history_7d.data;
        } else if ((activeTab === 'Month' || activeTab === 'Year') && insights.mood_history_30d && insights.mood_history_30d.data) {
          moodHistoryData = insights.mood_history_30d.data;
        } else if (insights.mood_history_30d && insights.mood_history_30d.data) {
          // Fallback to 30d data if specific period not available
          moodHistoryData = insights.mood_history_30d.data;
        }
        
        // Transform API data format to match our chart's expected format
        const formattedData = moodHistoryData.map(item => ({
          date: formatDate(item.date, activeTab),
          value: convertMoodToValue(item.mood)
        }));
        
        setMoodData(formattedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching mood data:', err);
        setError('Failed to load mood data');
        setIsLoading(false);
      }
    };
    
    fetchMoodData();
  }, [activeTab]);

  // Helper function to format dates based on the selected time period
  const formatDate = (dateStr: string, timeframe: string): string => {
    const date = new Date(dateStr);
    
    switch(timeframe) {
      case 'Day':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case 'Week':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'Month':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'Year':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to get the auth token from localStorage or wherever you store it
  const getToken = (): string => {
    // Implement based on your app's authentication mechanism
    // For example:
    return localStorage.getItem('token') || '';
  };

  // Helper function to convert mood text to a 0-10 scale
  const convertMoodToValue = (mood: string): number => {
    // Convert mood text to numeric value
    const moodMap: {[key: string]: number} = {
      "happy": 9,
      "Happy": 9,
      "Good": 8,
      "good": 8,
      "neutral": 5,
      "Neutral": 5,
      "Stressed": 3,
      "stressed": 3,
      "Angry": 2,
      "angry": 2,
      "Sad": 2,
      "sad": 2,
      "Depressed": 1,
      "depressed": 1
    };
    
    // Return the mapped value or a default middle value if mood not found
    return moodMap[mood] || 5;
  };

  const tabs: Array<'Day' | 'Week' | 'Month' | 'Year'> = ['Day', 'Week', 'Month', 'Year'];

  // Calculate average mood if data is available
  const calculateAverageMood = (): string => {
    if (moodData.length === 0) return "N/A";
    const sum = moodData.reduce((total, entry) => total + entry.value, 0);
    return (sum / moodData.length).toFixed(1);
  };

  // Theme colors based on darkMode state
  const colors = {
    background: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-200' : 'text-gray-700',
    secondaryText: darkMode ? 'text-gray-400' : 'text-gray-600',
    chartBackground: darkMode ? 'bg-gray-700' : 'bg-blue-50',
    chartText: darkMode ? 'text-gray-300' : 'text-gray-400',
    link: darkMode ? 'text-blue-400' : 'text-blue-500',
    tabActive: darkMode ? 'bg-blue-600' : 'bg-blue-500',
    tabInactive: darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-blue-100',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    error: darkMode ? 'text-red-400' : 'text-red-500',
    loading: darkMode ? 'text-gray-500' : 'text-gray-400',
    line: darkMode ? '#a78bfa' : '#8884d8', // Tailwind purple-400 for dark mode
    shadow: darkMode ? 'shadow-lg shadow-gray-900/20' : 'shadow-md'
  };

  // Custom tooltip style for dark mode
  const tooltipStyle = {
    backgroundColor: darkMode ? '#374151' : 'white', // gray-700 in dark mode
    border: darkMode ? '1px solid #4B5563' : '1px solid #E5E7EB', // gray-600/gray-200
    borderRadius: '6px',
    padding: '8px',
    color: darkMode ? '#E5E7EB' : '#374151', // gray-200/gray-700
    fontSize: '12px'
  };

  return (
    <div className={`p-6 rounded-xl ${colors.shadow} space-y-4 ${colors.background} ${colors.border}`}>
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${colors.text}`}>Mood Trends</h2>
        <a href="#" className={`text-sm ${colors.link} hover:underline`}>View All</a>
      </div>

      {/* Tabs */}
      <div className={`flex space-x-2 ${colors.text}`}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
              activeTab === tab ? `${colors.tabActive} text-white` : colors.tabInactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`${colors.chartBackground} h-48 rounded-lg overflow-hidden`}>
        {isLoading ? (
          <div className={`h-full flex items-center justify-center ${colors.loading}`}>
            Loading mood data...
          </div>
        ) : error ? (
          <div className={`h-full flex items-center justify-center ${colors.error}`}>
            {error}
          </div>
        ) : moodData.length === 0 ? (
          <div className={`h-full flex items-center justify-center ${colors.loading}`}>
            No mood data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                opacity={0.2} 
                stroke={darkMode ? '#6B7280' : '#E5E7EB'} // gray-500 / gray-200
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: darkMode ? '#E5E7EB' : '#4B5563' }} // gray-200 / gray-600
                tickLine={{ stroke: darkMode ? '#6B7280' : '#9CA3AF' }}
                axisLine={{ stroke: darkMode ? '#6B7280' : '#D1D5DB' }} // gray-500 / gray-300
              />
              <YAxis 
                domain={[0, 10]} 
                ticks={[0, 2, 4, 6, 8, 10]} 
                tickFormatter={(value) => value.toString()}
                tick={{ fontSize: 10, fill: darkMode ? '#E5E7EB' : '#4B5563' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}/10`, 'Mood Rating']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={tooltipStyle}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.line}
                strokeWidth={2}
                dot={{ r: 4, fill: colors.line }}
                activeDot={{ r: 6, fill: darkMode ? '#c4b5fd' : '#a78bfa' }} // purple-300/purple-400
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Summary */}
      <div className={`text-sm ${colors.secondaryText}`}>
        {!isLoading && !error && moodData.length > 0 && (
          <div className="flex items-center">
            <span className={`font-medium ${colors.text}`}>Average Mood:</span>
            <span className="ml-2">
              {calculateAverageMood()}/10
            </span>
          </div>
        )}
      </div>
    </div>
  );
}