'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface JournalEntry {
  id: number;
  date: string;
  mood: string;
  title: string;
  snippet: string;
}

export default function RecentEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    axios.get('https://mentalheathapp.vercel.app/api/v1/journal/')
      .then(res => setEntries(res.data.entries))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Recent Entries</h2>
        <a href="#" className="text-sm text-blue-500 hover:underline">See All</a>
      </div>

      <div className="space-y-4">
        {entries.length ? entries.map(entry => (
          <div key={entry.id} className="flex items-start space-x-4">
            {/* Date badge */}
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-blue-600">{new Date(entry.date).getDate()}</div>
              <div className="text-xs text-gray-400">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</div>
            </div>

            {/* Entry info */}
            <div className="flex-1 border-b pb-3">
              <h3 className="text-gray-800 font-semibold">{entry.title}</h3>
              <p className="text-gray-500 text-sm">{entry.snippet}</p>
            </div>

            {/* Mood emoji */}
            <div className="text-xl">{entry.mood}</div>
          </div>
        )) : (
          <div className="text-gray-400 text-center">No entries yet.</div>
        )}
      </div>
    </div>
  );
}
