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

export default function MoodChart() {
  const [data, setData] = useState(null);
  const [moodData, setMoodData] = useState<{ date: string; value: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // Process the data based on active tab
        processData(activeTab);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load mood data');
        setIsLoading(false);
      }
    }, 1000);
  }, [activeTab]);

  const processData = (timeframe: 'Day' | 'Week' | 'Month' | 'Year') => {
    // Sample data structure - this would typically come from your API
    // This is a placeholder implementation
    let filteredData = [];
    
    const currentDate = new Date();
    
    switch(timeframe) {
      case 'Day':
        // Last 24 hours data
        filteredData = generateSampleData(1, currentDate);
        break;
      case 'Week':
        // Last 7 days data
        filteredData = generateSampleData(7, currentDate);
        break;
      case 'Month':
        // Last 30 days data
        filteredData = generateSampleData(30, currentDate);
        break;
      case 'Year':
        // Last 12 months data
        filteredData = generateSampleData(12, currentDate, true);
        break;
      default:
        filteredData = generateSampleData(7, currentDate);
    }
    
    setMoodData(filteredData);
  };

  // Helper function to generate sample data
  const generateSampleData = (count: number, endDate: Date, isMonthly: boolean = false) => {
    const result = [];
    const endDateTime = endDate.getTime();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(endDateTime);
      
      if (isMonthly) {
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        result.push({
          date: monthName,
          value: Math.floor(Math.random() * 6) + 5 // Random value between 5-10
        });
      } else {
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        result.push({
          date: dayStr,
          value: Math.floor(Math.random() * 6) + 5 // Random value between 5-10
        });
      }
    }
    
    return result;
  };

  const tabs: Array<'Day' | 'Week' | 'Month' | 'Year'> = ['Day', 'Week', 'Month', 'Year'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Mood Trends</h2>
        <a href="#" className="text-sm text-blue-500 hover:underline">View All</a>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
              activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-blue-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-blue-50 h-48 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading mood data...
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : moodData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No mood data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 10]} 
                ticks={[0, 2, 4, 6, 8, 10]} 
                tickFormatter={(value) => value.toString()}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}/10`, 'Mood Rating']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4, fill: "#8884d8" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Summary */}
      <div className="text-sm text-gray-600">
        {!isLoading && !error && moodData.length > 0 && (
          <div className="flex items-center">
            <span className="font-medium">Average Mood:</span>
            <span className="ml-2">
              {(moodData.reduce((sum, entry) => sum + entry.value, 0) / moodData.length).toFixed(1)}/10
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
