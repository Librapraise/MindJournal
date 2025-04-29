'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DailyPrompt() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    axios.get('https://mentalheathapp.vercel.app/journal/prompt/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
      }
    })
      .then(res => {
        // The API directly returns a string, not a JSON object with a prompt property
        setPrompt(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching prompt:", err);
        setError("Failed to load today's prompt");
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-blue-500 p-6 rounded-xl shadow-md text-white">
      <h2 className="text-lg font-semibold mb-3">Today's Prompt</h2>
      {isLoading ? (
        <p className="text-blue-100">Loading prompt...</p>
      ) : error ? (
        <p className="text-red-200">{error}</p>
      ) : (
        <p>{prompt || "No prompt available for today. Check back later!"}</p>
      )}
    </div>
  );
}
