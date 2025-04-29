'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MoodChart() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Week');

  useEffect(() => {
    axios.get('https://mentalheathapp.vercel.app/journal/insights/')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const tabs = ['Day', 'Week', 'Month', 'Year'];

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
      <div className="bg-blue-50 h-48 rounded-lg flex items-center justify-center text-gray-400">
        {/* Replace with chart later */}
        [Mood Chart Placeholder]
      </div>
    </div>
  );
}
