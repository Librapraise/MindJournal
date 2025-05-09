'use client';

import { useEffect, useState } from 'react';

// Define the theme data interface
interface ThemeData {
  theme: string;
  count: number;
}

interface ThemeCloudProps {
  days?: number;
  darkMode?: boolean;
}

export default function ThemeCloud({ days = 30, darkMode = false }: ThemeCloudProps) {
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThemeData = async () => {
      setIsLoading(true);
      
      try {
        // Using the API endpoint from your FastAPI code
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
        
        const insights = await response.json();
        
        if (insights.theme_cloud_30d && insights.theme_cloud_30d.data) {
          setThemes(insights.theme_cloud_30d.data);
        } else {
          setThemes([]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching theme data:', err);
        setError('Failed to load theme data');
        setIsLoading(false);
      }
    };
    
    fetchThemeData();
  }, [days]);

  // Helper function to get the auth token
  const getToken = (): string => {
    return localStorage.getItem('token') || '';
  };

  // Calculate font size based on count (for tag cloud effect)
  const getFontSize = (count: number): string => {
    const maxCount = Math.max(...themes.map(item => item.count));
    const minSize = 0.7; // 0.7rem
    const maxSize = 1.1; // 1.1rem
    
    if (maxCount === 0) return `${minSize}rem`;
    
    const size = minSize + ((count / maxCount) * (maxSize - minSize));
    return `${size.toFixed(1)}rem`;
  };

  // Calculate opacity based on count
  const getOpacity = (count: number): number => {
    const maxCount = Math.max(...themes.map(item => item.count));
    const minOpacity = 0.6;
    
    if (maxCount === 0) return minOpacity;
    
    return minOpacity + ((count / maxCount) * (1 - minOpacity));
  };

  // Theme colors based on darkMode state
  const colors = {
    background: darkMode ? 'bg-gray-800' : 'bg-white',
    cardBackground: darkMode ? 'bg-gray-700' : 'bg-blue-50',
    text: darkMode ? 'text-gray-200' : 'text-gray-700',
    secondaryText: darkMode ? 'text-gray-200' : 'text-gray-500',
    titleText: darkMode ? 'text-gray-200' : 'text-gray-700',
    errorText: darkMode ? 'text-red-400' : 'text-red-500',
    loadingText: darkMode ? 'text-gray-500' : 'text-gray-400',
    shadow: darkMode ? 'shadow-lg shadow-gray-900/20' : 'shadow-md',
    // Theme tag colors
    tagBackground: darkMode ? 'bg-indigo-900' : 'bg-blue-100',
    tagText: darkMode ? 'text-indigo-200' : 'text-blue-700',
    tagCount: darkMode ? 'text-indigo-300' : 'text-blue-500'
  };

  return (
    <div className={`p-4 rounded-lg ${colors.shadow} ${colors.background} ${colors.text}`}>
      {/* Title */}
      <div className="flex justify-between items-center mb-3">
        <h2 className={`text-lg font-semibold ${colors.titleText}`}>Related Themes</h2>
        <div className={`text-sm ${colors.secondaryText}`}>Last {days} days</div>
      </div>

      {/* Theme Cloud */}
      <div className={`${colors.cardBackground} min-h-[150px] p-4 rounded-lg`}>
        {isLoading ? (
          <div className={`h-24 flex items-center justify-center ${colors.loadingText}`}>
            Loading themes...
          </div>
        ) : error ? (
          <div className={`h-24 flex items-center justify-center ${colors.errorText}`}>
            {error}
          </div>
        ) : themes.length === 0 ? (
          <div className={`h-24 flex items-center justify-center ${colors.loadingText}`}>
            No themes found
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, index) => (
              <div 
                key={index}
                className={`px-3 py-1 rounded-full ${colors.tagBackground} ${colors.tagText}`}
                style={{ 
                  fontSize: getFontSize(theme.count),
                  opacity: getOpacity(theme.count)
                }}
              >
                {theme.theme}
                <span className={`ml-1 text-xs ${colors.tagCount}`}>({theme.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}