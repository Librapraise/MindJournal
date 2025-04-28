'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DailyPrompt() {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    axios.get('https://mentalheathapp.vercel.app/api/v1/journal/prompt/')
      .then(res => setPrompt(res.data.prompt))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-blue-500 p-6 rounded-xl shadow-md text-white">
      <h2 className="text-lg font-semibold mb-3">Today's Prompt</h2>
      <p>{prompt || 'Loading prompt...'}</p>
    </div>
  );
}
