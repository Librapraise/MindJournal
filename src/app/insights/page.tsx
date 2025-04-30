"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
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

export default function InsightsPage() {
  // State for different data sets
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [themeData, setThemeData] = useState<ThemeData[]>([]);
  const [wordData, setWordData] = useState<WordData[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>([]);
  const [timeRange, setTimeRange] = useState("month");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from GET /api/v1/journal/insights/
    setTimeout(() => {
      setMoodData([
        { date: "Apr 24", value: 8, mood: "Happy" },
        { date: "Apr 25", value: 7, mood: "Content" },
        { date: "Apr 26", value: 6, mood: "Neutral" },
        { date: "Apr 27", value: 4, mood: "Anxious" },
        { date: "Apr 28", value: 3, mood: "Sad" },
        { date: "Apr 29", value: 5, mood: "Neutral" },
        { date: "Apr 30", value: 7, mood: "Content" },
      ]);
      
      setThemeData([
        { name: "Work", value: 35, color: "#3B82F6" },
        { name: "Relationships", value: 25, color: "#EC4899" },
        { name: "Health", value: 15, color: "#10B981" },
        { name: "Hobbies", value: 15, color: "#F59E0B" },
        { name: "Self-care", value: 10, color: "#8B5CF6" },
      ]);
      
      setWordData([
        { text: "Anxious", value: 25 },
        { text: "Meeting", value: 18 },
        { text: "Project", value: 15 },
        { text: "Family", value: 12 },
        { text: "Sleep", value: 10 },
        { text: "Exercise", value: 8 },
        { text: "Weekend", value: 7 },
        { text: "Deadline", value: 6 },
      ]);
      
      setCopingStrategies([
        {
          title: "Breathwork for Anxiety",
          description: "Based on your journal entries about work stress, try 4-7-8 breathing when feeling overwhelmed.",
          tags: ["anxiety", "work", "stress"]
        },
        {
          title: "Morning Routine",
          description: "Your entries show better days when you have a consistent morning. Consider building a 15-minute mindfulness routine.",
          tags: ["routine", "mindfulness", "morning"]
        },
        {
          title: "Social Connection",
          description: "Your mood improves after social interactions. Schedule regular check-ins with friends even during busy periods.",
          tags: ["social", "connection", "friends"]
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  // Function to render word cloud (simplified)
  const renderWordCloud = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {wordData.map((word, index) => (
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Insights</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-lg overflow-hidden">
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
            <button className="flex items-center text-sm text-indigo-600 hover:text-indigo-800">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <button className="flex items-center text-sm text-indigo-600 hover:text-indigo-800">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood tracking chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Mood Trends</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <Filter className="h-4 w-4" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
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
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>7-day average: <span className="font-medium text-gray-700">5.7/10</span></p>
              <p>Trend: <span className="text-green-600 font-medium">↑ Improving</span></p>
            </div>
          </div>

          {/* Themes pie chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Journal Themes</h3>
              <div className="text-sm text-gray-500">Based on 28 entries</div>
            </div>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {themeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {themeData.map((theme, index) => (
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
              {copingStrategies.map((strategy, index) => (
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
              ))}
            </div>
          </div>

          {/* Pattern detection */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patterns & Correlations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                  <h4 className="font-medium">Time of Day Impact</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Your mood tends to be highest in the morning hours (6-10am), 
                  and lowest in the late afternoon (3-5pm).
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <BarChart2 className="h-5 w-5 text-indigo-500 mr-2" />
                  <h4 className="font-medium">Activity Correlation</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Entries mentioning exercise show a 40% higher mood rating on average
                  compared to days without exercise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}