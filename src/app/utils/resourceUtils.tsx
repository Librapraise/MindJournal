// src/app/resources/utils.ts (or similar path)
import React from "react";
import { BookOpen, Video, Headphones, LucideIcon } from "lucide-react";

// Helper to create a clean text snippet from HTML content
export const createSnippet = (content: string, maxLength: number = 100): string => {
  if (!content) return '';
  // Remove HTML tags to get plain text
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
};

// Helper to get the right icon for a category
export const getCategoryIcon = (category: string): React.ReactElement => {
  switch (category) {
    case "article":
      return <BookOpen className="w-6 h-6 text-blue-500" />;
    case "video":
      return <Video className="w-6 h-6 text-red-500" />;
    case "audio":
      return <Headphones className="w-6 h-6 text-purple-500" />;
    case "exercise":
      // Assuming 'exercise' uses BookOpen based on original code
      return <BookOpen className="w-6 h-6 text-green-500" />;
    default:
      return <BookOpen className="w-6 h-6 text-gray-500" />;
  }
};

// Potentially move Type definitions here too if used across multiple files
export type Resource = {
  id: string;
  title: string;
  body: string;
  category: "article" | "video" | "audio" | "exercise";
  tags: string[];
  duration: string;
  isSaved: boolean;
  rating: number;
  imageUrl?: string;
};

export type JournalArticle = {
  title: string;
  body: string;
  triggering_mood: string;
  generation_variation_key: string;
  id: number; // Keeping as number from original type
  user_id: string;
  generated_at: string;
  source_journal_entry_id: number;
};

export type Category = {
  id: "article" | "video" | "audio" | "exercise";
  name: string;
  icon: LucideIcon;
  count: number;
};