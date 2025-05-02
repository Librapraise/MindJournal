"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

type ThemeData = {
  theme: string;
  count: number;
  sentiment_correlation: number;
};

type InsightItem = {
  icon: string;
  title: string;
  description: string;
  percentage: string;
  trend: "positive" | "neutral" | "negative";
};

interface InsightsProps {
  darkMode: boolean;
}

export default function Insights({ darkMode }: InsightsProps) {
  const [themeData, setThemeData] = useState<ThemeData[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios.get('https://mentalheathapp.vercel.app/journal/insights/?days_mood=30&days_themes=30', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
      }
    })
      .then(res => {
        // Get theme cloud data
        const themeCloudData = res.data.theme_cloud_30d?.data || [];
        setThemeData(themeCloudData);
        
        // Generate insights from theme data
        const generatedInsights = generateInsightsFromThemes(themeCloudData);
        setInsights(generatedInsights);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching insights:", err);
        setError("Failed to load insights");
        setIsLoading(false);
      });
  }, []);

  // Helper function to generate insights from theme data
  const generateInsightsFromThemes = (themes: ThemeData[]): InsightItem[] => {
    if (!themes || themes.length === 0) {
      // Return default insights if no theme data
      return getDefaultInsights();
    }

    // Sort themes by sentiment correlation (highest positive impact first)
    const sortedThemes = [...themes].sort((a, b) => 
      b.sentiment_correlation - a.sentiment_correlation
    );

    // Get top 4 themes with positive correlation
    const positiveThemes = sortedThemes
      .filter(theme => theme.sentiment_correlation > 0)
      .slice(0, 4);

    if (positiveThemes.length === 0) {
      return getDefaultInsights();
    }

    // Map themes to insight items
    return positiveThemes.map(theme => {
      // Generate icon based on theme
      const icon = getThemeIcon(theme.theme);
      
      // Calculate percentage
      const percentage = `+${Math.round(theme.sentiment_correlation * 100)}%`;
      
      return {
        icon,
        title: capitalizeFirstLetter(theme.theme),
        description: `This theme correlates with better mood`,
        percentage,
        trend: "positive" as const
      };
    });
  };

  // Helper to get default insights
  const getDefaultInsights = (): InsightItem[] => {
    return [
      {
        icon: "✨",
        title: "Gratitude Focus",
        description: "You mention gratitude frequently",
        percentage: "+15%",
        trend: "positive"
      },
      {
        icon: "🌿",
        title: "Nature Connection",
        description: "Time in nature improves your mood",
        percentage: "+23%",
        trend: "positive"
      },
      {
        icon: "💤",
        title: "Sleep Quality",
        description: "Mood correlation with sleep",
        percentage: "+8%",
        trend: "positive"
      },
      {
        icon: "🏃‍♂️",
        title: "Exercise Impact",
        description: "Physical activity boosts mood",
        percentage: "+19%",
        trend: "positive"
      }
    ];
  };

  // Helper to get icon for theme
  const getThemeIcon = (theme: string): string => {
    const themeIconMap: Record<string, string> = {
      gratitude: "✨",
      nature: "🌿",
      sleep: "💤",
      exercise: "🏃‍♂️",
      family: "👨‍👩‍👧‍👦",
      friends: "👫",
      work: "💼",
      study: "📚",
      meditation: "🧘",
      food: "🍎",
      health: "❤️",
      creativity: "🎨",
      music: "🎵",
      reading: "📖",
      writing: "✍️",
      stress: "😰",
      anxiety: "😓",
      joy: "😄",
      sadness: "😢"
    };

    // Find matching icon or fallback to default
    for (const [key, icon] of Object.entries(themeIconMap)) {
      if (theme.toLowerCase().includes(key)) {
        return icon;
      }
    }
    
    return "🔍"; // Default icon
  };

  // Helper to capitalize first letter
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
      {/* Card Container */}
      <div className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} rounded-lg p-5 shadow-sm transition-colors duration-200`}>
        {/* Title */}
        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Insights</h2>
          <a href="/insights" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} text-sm hover:underline transition-colors duration-200`}>
            More
          </a>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading insights...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between ${
                  index < insights.length - 1 ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : ''
                } py-3 transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <span className={`text-xl mr-3 p-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-md transition-colors duration-200`}>
                    {insight.icon}
                  </span>
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {insight.title}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  insight.trend === "positive" ? 
                    darkMode ? "text-green-400" : "text-green-500" : 
                  insight.trend === "negative" ? 
                    darkMode ? "text-red-400" : "text-red-500" : 
                    darkMode ? "text-gray-400" : "text-gray-500"
                } transition-colors duration-200`}>
                  {insight.percentage}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}