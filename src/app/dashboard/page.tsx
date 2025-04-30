'use client';

import MoodChart from "../components/MoodChart";
import DailyPrompt from "../components/DailyPrompt";
import RecentEntries from "../components/RecentEntries";
import Insights from "../components/Insights";
import { Button } from "../components/ui/button";

export default function DashboardPage() {
  return (
    <main className="flex-1 p-6 lg:pl-72 space-y-6 overflow-auto bg-blue-50 min-h-screen">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-700">Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline">View Calendar</Button>
          <a href="/journal" className="">
            <Button variant="primary">New Entry</Button>
          </a>
        </div>
      </div>

      {/* Mood Trends */}
      <MoodChart />

      {/* Today's Prompt */}
      <DailyPrompt />

      {/* Recent Entries */}
      <RecentEntries />

      {/* AI-Generated Insights */}
      <Insights />
    </main>
  );
}
