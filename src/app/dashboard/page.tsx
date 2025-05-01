'use client';

import { useState } from "react";
import MoodChart from "../components/MoodChart";
import DailyPrompt from "../components/DailyPrompt";
import RecentEntries from "../components/RecentEntries";
import Insights from "../components/Insights";
import { Button } from "../components/ui/button";
import ThemeCloud from "../components/ThemeCloud";
import MoodHistoryList from "../components/MoodHistory";
import CalendarModal from "../components/Calendar";

export default function DashboardPage() {


  const [showCalendar, setShowCalendar] = useState(false);
  
  const handleViewCalendar = () => {
    setShowCalendar(prev => !prev);
  };


  return (
    <main className="flex-1 p-6 lg:pl-72 space-y-6 overflow-auto bg-blue-50 min-h-screen">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-700">Dashboard</h1>
        <div className="flex space-x-3">
          <div 
            onClick={() => setShowCalendar(true)}
            className="cursor-pointer"
          >
            <Button variant="outline">
              View Calendar
            </Button>
          </div>
          <a href="/journal" className="">
            <Button variant="primary">New Entry</Button>
          </a>
        </div>
      </div>

      {/* Calendar Modal (conditionally rendered) */}
            {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}

      {/* Mood Trends */}
      <MoodChart />
      
      {/* Mood Themes */}
      <ThemeCloud days={30} />

      {/* Mood History */}
      <MoodHistoryList />

      {/* Today's Prompt */}
      <DailyPrompt />

      {/* Recent Entries */}
      <RecentEntries />

      {/* AI-Generated Insights */}
      <Insights />
    </main>
  );
}
