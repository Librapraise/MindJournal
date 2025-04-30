"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Brain, BarChart2, Filter, Download, RefreshCw } from "lucide-react";

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

export default function InsightsPage() {
  // State for different data sets
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [timeRange, setTimeRange] = useState("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallbackData, setUseFallbackData] = useState(false);

  // Fetch insights data from API
  const fetchInsights = async (range = timeRange) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get authentication token from localStorage (make sure it's set during login)
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(
        `https://mentalheathapp.vercel.app/journal/insights/?timeframe=${range}`,
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
      setInsights(data);
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
    color: THEME_COLORS[index % THEME_COLORS.length]
  })) || [];

  // Function to render word cloud
  const renderWordCloud = () => {
    if (!insights?.common_words || insights.common_words.length === 0) {
      return <p className="text-gray-500">No word data available</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {insights.common_words.map((word, index) => (
          <span 
            key={index} 
            className="px-3 py-1 rounded-full bg-blue-100 text-blue-800"
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

  // Show loading state only when loading and no data is available yet
  if (isLoading && !insights) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !useFallbackData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-64">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Insights</h2>
          <div className="flex flex-col items-center mt-4 md:flex-row space-x-4">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${timeRange === 'week' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 text-sm ${timeRange === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('month')}
              >
                Month
              </button>
              <button 
                className={`px-3 py-1 text-sm ${timeRange === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('year')}
              >
                Year
              </button>
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <button 
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
              <button className="flex items-center text-sm text-indigo-600 hover:text-indigo-800">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:flex lg:flex-col gap-6">
            {/* Mood tracking chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Mood Trends</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <Filter className="h-4 w-4" />
                </button>
              </div>
              <div className="h-64">
                {insights?.mood_trends?.length ?? 0 > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.mood_trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis 
                        domain={[0, 10]} 
                        ticks={[0, 2, 4, 6, 8, 10]} 
                        tickFormatter={(value) => value.toString()}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}/10`, 'Mood Rating']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No mood data available for this time period
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  {timeRange} average: 
                  <span className="font-medium text-gray-700 ml-1">
                    {insights?.statistics?.average_mood?.toFixed(1) || 'N/A'}/10
                  </span>
                </p>
                <p>
                  Trend: 
                  <span className={`font-medium ml-1 ${
                    insights?.statistics?.trend_direction === 'up' 
                      ? 'text-green-600' 
                      : insights?.statistics?.trend_direction === 'down' 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {insights?.statistics?.trend_direction === 'up' && '↑ '}
                    {insights?.statistics?.trend_direction === 'down' && '↓ '}
                    {insights?.statistics?.trend || 'No trend data'}
                  </span>
                </p>
              </div>
            </div>

            {/* Themes pie chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Journal Themes</h3>
                <div className="text-sm text-gray-500">
                  Based on {insights?.statistics?.entry_count || 0} entries
                </div>
              </div>
              <div className="h-64 flex justify-center">
                {processedThemeData.length > 0 ? (
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {processedThemeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No theme data available for this time period
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {processedThemeData.map((theme, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: theme.color }}></div>
                    <span>{theme.name}: {theme.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common words */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Used Words</h3>
              <div className="min-h-40">
                {renderWordCloud()}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Words sized by frequency in your journal entries.
              </p>
            </div>

            {/* AI Coping strategies */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personalized Strategies</h3>
              <div className="space-y-4">
                {insights?.coping_strategies?.length ?? 0 > 0 ? (
                  insights.coping_strategies.map((strategy, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                      <h4 className="text-base font-medium text-gray-900">{strategy.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {strategy.tags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No strategies available for this time period</p>
                )}
              </div>
            </div>

            {/* Pattern detection */}
            <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patterns & Correlations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                    <h4 className="font-medium">Time of Day Impact</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    {insights?.patterns?.time_of_day || "No time of day patterns detected yet."}
                  </p>
                </div>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <BarChart2 className="h-5 w-5 text-indigo-500 mr-2" />
                    <h4 className="font-medium">Activity Correlation</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    {insights?.patterns?.activities || "No activity correlations detected yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}