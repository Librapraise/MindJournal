'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated (optional future upgrade)
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-blue-300 p-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome to Your Dashboard!</h1>
      <p className="text-gray-700 mb-6 text-center max-w-md">
        This is your personal space to reflect, track your mental health journey, and access insightful tools designed just for you.
      </p>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          router.push('/auth');
        }}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Logout
      </button>
    </div>
  );
}
