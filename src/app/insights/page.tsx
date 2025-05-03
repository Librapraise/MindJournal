"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Brain, BarChart2, Filter, Download, RefreshCw, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/ThemeContext"; 

// Types for our data
type MoodData = {
  date: string;
  value: number;
  mood: string;
};

type ThemeData = {
  name: string;
  value: number;
  color: string;
};

type WordData = {
  text: string;
  value: number;
};

type CopingStrategy = {
  title: string;
  description: string;
  tags: string[];
};

type InsightsData = {
  mood_trends: {
    date: string;
    value: number;
    mood: string;
  }[];
  themes: {
    name: string;
    value: number;
  }[];
  common_words: {
    text: string;
    value: number;
  }[];
  coping_strategies: {
    title: string;
    description: string;
    tags: string[];
  }[];
  patterns: {
    time_of_day: string;
    activities: string;
  };
  statistics: {
    average_mood: number;
    trend: string;
    trend_direction: "up" | "down" | "stable";
    entry_count: number;
  };
};

// Theme colors for consistency
const THEME_COLORS = [
  "#3B82F6", // blue
  "#EC4899", // pink
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EF4444", // red
  "#06B6D4", // cyan
  "#6366F1", // indigo
];

// Dark mode theme colors (slightly lighter for better visibility)
const DARK_THEME_COLORS = [
  "#60A5FA", // lighter blue
  "#F472B6", // lighter pink
  "#34D399", // lighter green
  "#FBBF24", // lighter amber
  "#A78BFA", // lighter purple
  "#F87171", // lighter red
  "#22D3EE", // lighter cyan
  "#818CF8", // lighter indigo
];

// Mock data for development/testing when API fails
const mockInsightsData: InsightsData = {
  mood_trends: [
    { date: "2025-04-23", value: 7, mood: "Content" },
    { date: "2025-04-24", value: 5, mood: "Neutral" },
    { date: "2025-04-25", value: 8, mood: "Happy" },
    { date: "2025-04-26", value: 4, mood: "Tired" },
    { date: "2025-04-27", value: 6, mood: "Calm" },
    { date: "2025-04-28", value: 7, mood: "Content" },
    { date: "2025-04-29", value: 9, mood: "Excited" },
    { date: "2025-04-30", value: 8, mood: "Happy" },
  ],
  themes: [
    { name: "Work", value: 35 },
    { name: "Relationships", value: 25 },
    { name: "Health", value: 20 },
    { name: "Personal Growth", value: 20 },
  ],
  common_words: [
    { text: "meeting", value: 25 },
    { text: "friend", value: 20 },
    { text: "happy", value: 18 },
    { text: "tired", value: 15 },
    { text: "project", value: 12 },
    { text: "exercise", value: 10 },
    { text: "coffee", value: 8 },
    { text: "sleep", value: 8 },
  ],
  coping_strategies: [
    {
      title: "Mindful Breathing",
      description: "Take 5 minutes each morning for deep breathing exercises to reduce work stress.",
      tags: ["anxiety", "work", "morning"]
    },
    {
      title: "Digital Sunset",
      description: "Put away screens 1 hour before bedtime to improve sleep quality.",
      tags: ["sleep", "evening", "habits"]
    },
    {
      title: "Weekly Social Connection",
      description: "Schedule at least one meaningful social interaction weekly to boost mood.",
      tags: ["relationships", "social", "mood"]
    }
  ],
  patterns: {
    time_of_day: "Your mood tends to be highest in the morning and lowest in the late afternoon.",
    activities: "Exercise and social activities correlate with higher mood ratings."
  },
  statistics: {
    average_mood: 6.8,
    trend: "Slightly improving",
    trend_direction: "up",
    entry_count: 14
  }
};

// Map frontend timeRange to API parameters
const timeRangeToApiParams = {
  week: { days_mood: 7, days_themes: 7 },
  month: { days_mood: 30, days_themes: 30 },
  year: { days_mood: 90, days_themes: 90 }
};

// Transform API response to our frontend InsightsData structure
interface ApiResponse {
  mood_history_7d?: { data?: { date: string; mood: string; mood_value?: number }[] };
  mood_history_30d?: { data?: { date: string; mood: string; mood_value?: number }[] };
  theme_cloud_30d?: { data?: { theme: string; count: number; frequency?: number }[] };
  common_words?: { word: string; frequency: number }[];
  coping_strategies?: { title: string; description: string; tags: string[] }[];
  patterns?: { time_of_day: string; activities: string };
}

// Mapping mood labels to numeric values
const moodToValueMap: Record<string, number> = {
  "Awful": 1,
  "Bad": 2,
  "Angry": 3,
  "Sad": 4,
  "Stressed": 5,
  "Neutral": 6,
  "Good": 7,
  "Content": 7,
  "Calm": 7,
  "happy": 8,
  "Happy": 8,
  "Excited": 9,
  "Amazing": 10
};

const transformApiResponse = (apiData: ApiResponse) => {
  // Initialize with default structure
  const insightsData: InsightsData = {
    mood_trends: [],
    themes: [],
    common_words: [],
    coping_strategies: [],
    patterns: {
      time_of_day: "",
      activities: ""
    },
    statistics: {
      average_mood: 0,
      trend: "",
      trend_direction: "stable",
      entry_count: 0
    }
  };

  // Process mood history data
  if (apiData.mood_history_7d?.data || apiData.mood_history_30d?.data) {
    const moodData = apiData.mood_history_7d?.data || apiData.mood_history_30d?.data || [];
    
    insightsData.mood_trends = moodData.map(item => {
      // Convert string date to YYYY-MM-DD format for display
      const dateObj = new Date(item.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      // Use mood_value if available, otherwise convert mood string to value
      const moodValue = item.mood_value !== undefined 
        ? item.mood_value 
        : (moodToValueMap[item.mood] || 6); // Default to 6 if mood string not found
      
      return {
        date: formattedDate,
        value: moodValue,
        mood: item.mood || "Neutral"
      };
    });

    // Calculate average and determine trend
    if (insightsData.mood_trends.length > 0) {
      const moodValues = insightsData.mood_trends.map(item => item.value);
      const avgMood = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
      insightsData.statistics.average_mood = avgMood;
      
      // Determine trend direction
      if (moodValues.length > 1) {
        const firstHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));
        const secondHalf = moodValues.slice(Math.floor(moodValues.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 0.5) {
          insightsData.statistics.trend_direction = "up";
          insightsData.statistics.trend = "Improving";
        } else if (secondAvg < firstAvg - 0.5) {
          insightsData.statistics.trend_direction = "down";
          insightsData.statistics.trend = "Declining";
        } else {
          insightsData.statistics.trend_direction = "stable";
          insightsData.statistics.trend = "Stable";
        }
      }
      
      insightsData.statistics.entry_count = moodValues.length;
    }
  }

// Process theme data
  if (apiData.theme_cloud_30d?.data) {
    // Get raw themes
    let themeData = apiData.theme_cloud_30d.data.map(theme => ({
      name: theme.theme,
      value: theme.frequency || theme.count || 0 // Use frequency if available, otherwise count
    }));
    
    // Normalize theme percentages
    const totalThemeValue = themeData.reduce((sum, theme) => sum + theme.value, 0);
    if (totalThemeValue > 0) {
      themeData = themeData.map(theme => ({
        ...theme,
        value: Math.round((theme.value / totalThemeValue) * 100)
      }));
    }
    
    // Sort themes by value (descending)
    themeData.sort((a, b) => b.value - a.value);
    
    // Keep only top 4 themes and group the rest as "Other"
    if (themeData.length > 4) {
      const topThemes = themeData.slice(0, 4);
      const otherThemes = themeData.slice(4);
      
      const otherValue = otherThemes.reduce((sum, theme) => sum + theme.value, 0);
      
      if (otherValue > 0) {
        topThemes.push({
          name: "Other",
          value: otherValue
        });
      }
      
      insightsData.themes = topThemes;
    } else {
      insightsData.themes = themeData;
    }
  }

  // If we have common words in the API response
  if (apiData.common_words) {
    insightsData.common_words = apiData.common_words.map(word => ({
      text: word.word,
      value: word.frequency
    }));
  } else {
    // Create dummy common words from mood data if no common words available
    const moodCounts: Record<string, number> = {};
    apiData.mood_history_30d?.data?.forEach(item => {
      if (item.mood) {
        moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
      }
    });
    
    insightsData.common_words = Object.entries(moodCounts).map(([mood, count]) => ({
      text: mood,
      value: count * 5 // Multiply by 5 to make values more significant for display
    }));
  }

  // If we have coping strategies in the API response
  if (apiData.coping_strategies) {
    insightsData.coping_strategies = apiData.coping_strategies;
  } else {
    // Add default coping strategies based on most common mood
    const moodFrequency: Record<string, number> = {};
    apiData.mood_history_30d?.data?.forEach(item => {
      if (item.mood) {
        moodFrequency[item.mood] = (moodFrequency[item.mood] || 0) + 1;
      }
    });
    
    const mostCommonMoods = Object.entries(moodFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);
    
    const defaultStrategies: CopingStrategy[] = [];
    
    if (mostCommonMoods.includes("Stressed") || mostCommonMoods.includes("Angry")) {
      defaultStrategies.push({
        title: "5-Minute Breathing Exercise",
        description: "Take 5 minutes to practice deep breathing: inhale for 4 counts, hold for 4, exhale for 6.",
        tags: ["stress", "anxiety", "anger"]
      });
    }
    
    if (mostCommonMoods.includes("Sad")) {
      defaultStrategies.push({
        title: "Mood-Boosting Activities",
        description: "Schedule one enjoyable activity each day, even if brief, to gradually improve your mood.",
        tags: ["sadness", "mood", "self-care"]
      });
    }
    
    // Add a general strategy
    defaultStrategies.push({
      title: "Daily Reflection",
      description: "Spend 5 minutes each night noting three positive moments from your day, no matter how small.",
      tags: ["gratitude", "mindfulness", "routine"]
    });
    
    insightsData.coping_strategies = defaultStrategies;
  }

  // If we have patterns in the API response
  if (apiData.patterns) {
    insightsData.patterns = apiData.patterns;
  } else {
    // Default patterns based on mood data
    insightsData.patterns = {
      time_of_day: "Consider tracking the time of day alongside your moods to discover patterns.",
      activities: "Add notes about your activities to find connections between what you do and how you feel."
    };
  }

  return insightsData;
};

export default function InsightsPage() {
  // State for different data sets
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallbackData, setUseFallbackData] = useState(false);
  const { darkMode, toggleTheme } = useTheme();


  // Fetch insights data from API
  const fetchInsights = async (range = timeRange) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get authentication token from localStorage (make sure it's set during login)
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Get the API parameters based on the selected time range
      const { days_mood, days_themes } = timeRangeToApiParams[range];
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        days_mood: days_mood.toString(),
        days_themes: days_themes.toString()
      });
      
      const response = await fetch(
        `https://mentalheathapp.vercel.app/journal/insights/?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          // Auth token might be expired - redirect to login
          throw new Error('Your session has expired. Please login again.');
        } else {
          throw new Error(`Failed to fetch insights: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      // Transform API response to our frontend data structure
      const transformedData = transformApiResponse(data);
      setInsights(transformedData);
      setUseFallbackData(false);
    } catch (err) {
      console.error("Error fetching insights:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights';
      setError(errorMessage);
      
      // Use mock data for development rather than showing an error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for development');
        setInsights(mockInsightsData);
        setUseFallbackData(true);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with mock data in development for a better developer experience
  useEffect(() => {
    // Set initial state with mock data in development mode to prevent the need for auth during development
    if (process.env.NODE_ENV === 'development' && !insights) {
      setInsights(mockInsightsData);
      setUseFallbackData(true);
      setIsLoading(false);
    }
  }, []);

  // Fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchInsights(timeRange);
  }, [timeRange]);

  // Handle authentication errors
  useEffect(() => {
    if (error?.includes('session has expired') || error?.includes('not found')) {
      // Redirect to login page
      // You can use router.push('/login') if using Next.js router
      // For now we'll just alert the user
      alert('Please login again to continue');
      // Consider adding redirect logic here
    }
  }, [error]);

  // Process theme data to add colors
  const processedThemeData = insights?.themes?.map((theme, index) => ({
    ...theme,
    color: darkMode ? DARK_THEME_COLORS[index % DARK_THEME_COLORS.length] : THEME_COLORS[index % THEME_COLORS.length]
  })) || [];

  // Function to render word cloud
  const renderWordCloud = () => {
    if (!insights?.common_words || insights.common_words.length === 0) {
      return <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No word data available</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {insights.common_words.map((word, index) => (
          <span 
            key={index} 
            className={`px-3 py-1 rounded-full ${
              darkMode 
                ? 'bg-blue-900 text-blue-200' 
                : 'bg-blue-100 text-blue-800'
            } transition-colors duration-200`}
            style={{ 
              fontSize: `${Math.max(0.8, word.value / 10)}rem`,
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
    );
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchInsights(timeRange);
  };

  // Function to download insights as JSON
  const handleExport = () => {
    if (!insights) return;
    
    // Create a JSON blob
    const dataStr = JSON.stringify(insights, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `mental-health-insights-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  // Show loading state only when loading and no data is available yet
  if (isLoading && !insights) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-blue-50 text-gray-800'} transition-colors duration-200`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  if (error && !useFallbackData) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen text-red-500 ${darkMode ? 'bg-gray-900' : 'bg-blue-50'} transition-colors duration-200`}>
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className={`mt-4 px-4 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-blue-50 text-gray-900'} min-h-screen transition-colors duration-200`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-64">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>Your Insights</h2>
          <div className="flex flex-col items-center mt-4 md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden transition-colors duration-200`}>
                <button 
                  className={`cursor-pointer px-3 py-1 text-[11px] lg:text-sm ${
                    timeRange === 'week' 
                      ? darkMode 
                        ? 'bg-indigo-800 text-indigo-200' 
                        : 'bg-indigo-100 text-indigo-700' 
                      : darkMode 
                        ? 'bg-gray-800 text-gray-300' 
                        : 'bg-white text-gray-700'
                  } transition-colors duration-200`}
                  onClick={() => setTimeRange('week')}
                >
                  Week
                </button>
                <button 
                  className={`cursor-pointer px-3 py-1 text-[11px] lg:text-sm ${
                    timeRange === 'month' 
                      ? darkMode 
                        ? 'bg-indigo-800 text-indigo-200' 
                        : 'bg-indigo-100 text-indigo-700' 
                      : darkMode 
                        ? 'bg-gray-800 text-gray-300' 
                        : 'bg-white text-gray-700'
                  } transition-colors duration-200`}
                  onClick={() => setTimeRange('month')}
                >
                  Month
                </button>
                <button 
                  className={`cursor-pointer px-3 py-1 text-[11px] lg:text-sm ${
                    timeRange === 'year' 
                      ? darkMode 
                        ? 'bg-indigo-800 text-indigo-200' 
                        : 'bg-indigo-100 text-indigo-700' 
                      : darkMode 
                        ? 'bg-gray-800 text-gray-300' 
                        : 'bg-white text-gray-700'
                  } transition-colors duration-200`}
                  onClick={() => setTimeRange('year')}
                >
                  Year
                </button>
              </div>
              
              {/* Dark Mode Toggle Button */}
              <button 
                onClick={toggleTheme}
                className={`cursor-pointer p-2 rounded-full ${
                  darkMode 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                className={`cursor-pointer flex items-center text-[11px] lg:text-sm ${
                  darkMode 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-800'
                } transition-colors duration-200`}
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
              <button 
                className={`cursor-pointer flex items-center text-[11px] lg:text-sm ${
                  darkMode 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-800'
                } transition-colors duration-200`}
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'} transition-colors duration-200`}></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:flex lg:flex-col gap-6">
            {/* Mood tracking chart */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>Mood Trends</h3>
                <button className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors duration-200`}>
                  <Filter className="h-4 w-4" />
                </button>
              </div>
              <div className="h-64">
                {insights?.mood_trends?.length ?? 0 > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights?.mood_trends}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke={darkMode ? '#4B5563' : '#E5E7EB'} 
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke={darkMode ? '#9CA3AF' : '#6B7280'} 
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        ticks={[0, 2, 4, 6, 8, 10]} 
                        tickFormatter={(value) => value.toString()}
                        stroke={darkMode ? '#9CA3AF' : '#6B7280'} 
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}/10`, 'Mood Rating']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : 'white',
                          borderColor: darkMode ? '#4B5563' : '#E5E7EB',
                          color: darkMode ? '#F9FAFB' : 'inherit'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={darkMode ? '#818CF8' : '#8884d8'} 
                        strokeWidth={2}
                        dot={{ r: 4, fill: darkMode ? '#818CF8' : '#8884d8' }}
                        activeDot={{ r: 6, fill: darkMode ? '#818CF8' : '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-400'} transition-colors duration-200`}>
                    No mood data available for this time period
                  </div>
                )}
              </div>
              <div className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>
                <p>
                  {timeRange} average: 
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ml-1 transition-colors duration-200`}>
                    {insights?.statistics?.average_mood?.toFixed(1) || 'N/A'}/10
                  </span>
                </p>
                <p>
                  Trend: 
                  <span className={`font-medium ml-1 ${
                    insights?.statistics?.trend_direction === 'up' 
                      ? darkMode ? 'text-green-400' : 'text-green-600' 
                      : insights?.statistics?.trend_direction === 'down' 
                        ? darkMode ? 'text-red-400' : 'text-red-600' 
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                  } transition-colors duration-200`}>
                    {insights?.statistics?.trend_direction === 'up' && '↑ '}
                    {insights?.statistics?.trend_direction === 'down' && '↓ '}
                    {insights?.statistics?.trend || 'Stable'}
                  </span>
                </p>
              </div>
            </div>

            {/* Main insights grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Themes pie chart */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Related Themes
                  </div>
                </h3>
                {processedThemeData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={processedThemeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {processedThemeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Frequency']}
                            contentStyle={{
                              backgroundColor: darkMode ? '#1F2937' : 'white',
                              borderColor: darkMode ? '#4B5563' : '#E5E7EB',
                              color: darkMode ? '#F9FAFB' : 'inherit'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                      {processedThemeData.map((theme, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: theme.color }}
                          ></div>
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-200`}>
                            {theme.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`h-64 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-400'} transition-colors duration-200`}>
                    No theme data available
                  </div>
                )}
              </div>

              {/* Common words */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>
                  <div className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Words & Phrases
                  </div>
                </h3>
                <div className="h-64 overflow-y-auto">
                  {renderWordCloud()}
                </div>
              </div>

              {/* Patterns */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Patterns
                  </div>
                </h3>
                <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-200`}>
                  <div>
                    <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>Time of Day</h4>
                    <p>{insights?.patterns?.time_of_day || 'No patterns detected yet'}</p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>Activities</h4>
                    <p>{insights?.patterns?.activities || 'No activity patterns detected yet'}</p>
                  </div>
                </div>
              </div>

              {/* Coping strategies */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Personalized Strategies
                  </div>
                </h3>
                <div className="space-y-4 h-64 overflow-y-auto">
                  {insights?.coping_strategies?.map((strategy, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-l-4 border-indigo-600' 
                          : 'bg-blue-50 border-l-4 border-blue-500'
                      } transition-colors duration-200`}
                    >
                      <h4 className={`font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'} transition-colors duration-200`}>
                        {strategy.title}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
                        {strategy.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {strategy.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex} 
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              darkMode 
                                ? 'bg-gray-600 text-gray-300' 
                                : 'bg-gray-200 text-gray-700'
                            } transition-colors duration-200`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {(!insights?.coping_strategies || insights.coping_strategies.length === 0) && (
                    <div className={`h-full flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-400'} transition-colors duration-200`}>
                      No strategies available
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Statistics summary */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm transition-colors duration-200`}>
              <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors duration-200`}>Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-200`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>Average Mood</div>
                  <div className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-200`}>
                    {insights?.statistics?.average_mood?.toFixed(1) || 'N/A'}/10
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-200`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>Trend</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    insights?.statistics?.trend_direction === 'up' 
                      ? darkMode ? 'text-green-400' : 'text-green-600' 
                      : insights?.statistics?.trend_direction === 'down' 
                        ? darkMode ? 'text-red-400' : 'text-red-600' 
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                  } transition-colors duration-200`}>
                    {insights?.statistics?.trend_direction === 'up' && '↑ '}
                    {insights?.statistics?.trend_direction === 'down' && '↓ '}
                    {insights?.statistics?.trend || 'Stable'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors duration-200`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>Journal Entries</div>
                  <div className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'} transition-colors duration-200`}>
                    {insights?.statistics?.entry_count || 0}
                  </div>
                </div>
              </div>
              
              {/* Fallback data notice for developers */}
              {useFallbackData && process.env.NODE_ENV === 'development' && (
                <div className={`mt-4 p-2 text-sm rounded ${darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} transition-colors duration-200`}>
                  Using mock data for development. Connect to API for real data.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer with data disclaimer */}
        <div className={`mt-8 text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-colors duration-200`}>
          <p>Data analysis is for informational purposes only and does not constitute medical advice.</p>
          <p>Always consult with healthcare professionals for mental health concerns.</p>
        </div>
      </main>
    </div>
  );
}