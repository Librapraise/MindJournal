'use client';

import { useState } from "react";
import { useTheme } from "@/app/ThemeContext"; // Import the theme hook
import MoodChart from "../components/MoodChart";
import DailyPrompt from "../components/DailyPrompt";
import RecentEntries from "../components/RecentEntries";
import Insights from "../components/Insights";
import { Button } from "../components/ui/button";
import ThemeCloud from "../components/ThemeCloud";
import MoodHistoryList from "../components/MoodHistory";
import CalendarModal from "../components/Calendar";
import { Moon, Sun } from "lucide-react"; // Import icons for the toggle button

export default function DashboardPage() {
  const { darkMode, toggleTheme } = useTheme(); // Get both darkMode state and toggle function
  const [showCalendar, setShowCalendar] = useState(false);
  
  const handleViewCalendar = () => {
    setShowCalendar(prev => !prev);
  };

  return (
    <main className={`
      flex-1 p-6 lg:pl-72 space-y-6 overflow-auto min-h-screen transition-colors duration-200
      ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-blue-50 text-gray-700'}
    `}>
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Dashboard
        </h1>
        <div className="flex space-x-3 items-center">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center  cursor-pointer rounded-full w-10 h-10 ${
              darkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => setShowCalendar(true)}
            className={`btn-outline cursor-pointer ${darkMode ? 'border p-1 rounded-md border-gray-400 text-gray-300 hover:bg-gray-800' : 'border p-1 rounded-md border-gray-300'}`}
          >
            View Calendar
          </button>
          
          <a href="/journal">
            <Button 
              variant="primary"
              className={darkMode ? 'primary-dark' : 'primary-light'}
            >
              New Entry
            </Button>
          </a>
        </div>
      </div>

      {/* Calendar Modal (conditionally rendered) */}
      {showCalendar && (
        <CalendarModal 
          onClose={() => setShowCalendar(false)} 
          darkMode={darkMode}
        />
      )}

      {/* All components with dark mode prop */}
      <MoodChart darkMode={darkMode} />
      
      <ThemeCloud days={30} darkMode={darkMode} />

      <MoodHistoryList darkMode={darkMode} />

      <DailyPrompt darkMode={darkMode} />

      <RecentEntries darkMode={darkMode} />

      <Insights darkMode={darkMode} />
    </main>
  );
}