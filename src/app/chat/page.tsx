"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatbotUI from '@/app/components/ChatbotUI'; // Import the ChatbotUI component

export default function ChatPage() {
  const router = useRouter();
  
  // Check for authentication on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content area with proper padding for sidebar */}
      <div className="flex-1 lg:ml-64 md:ml-16 ">
        <ChatbotUI />
      </div>
    </div>
  );
}