'use client';

import { useEffect, useState } from 'react';

// Define the theme data interface
interface ThemeData {
  theme: string;
  count: number;
}

interface ThemeCloudProps {
  days?: number;
}

export default function ThemeCloud({ days = 30 }: ThemeCloudProps) {
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
    const minSize = 0.8; // 0.8rem
    const maxSize = 1.5; // 1.5rem
    
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Common Themes</h2>
        <div className="text-sm text-gray-500">Last {days} days</div>
      </div>

      {/* Theme Cloud */}
      <div className="bg-blue-50 min-h-[150px] p-4 rounded-lg">
        {isLoading ? (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Loading themes...
          </div>
        ) : error ? (
          <div className="h-24 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : themes.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-gray-400">
            No themes found
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, index) => (
              <div 
                key={index}
                className="px-3 py-1 rounded-full bg-blue-100 text-blue-700"
                style={{ 
                  fontSize: getFontSize(theme.count),
                  opacity: getOpacity(theme.count)
                }}
              >
                {theme.theme}
                <span className="ml-1 text-xs text-blue-500">({theme.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}