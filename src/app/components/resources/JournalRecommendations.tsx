// src/app/resources/components/JournalRecommendations.tsx
import React from 'react';
import RecommendationCard, { RecommendationCardData } from './RecommendationCard';
import JournalArticleCard from './JournalArticleCard';
import { JournalArticle } from '@/app/utils/resourceUtils'; // Assuming types are in utils

interface JournalRecommendationsProps {
  journalArticles: JournalArticle[];
  journalArticlesLoading: boolean;
  journalArticlesError: string | null;
  darkMode: boolean;
  onViewJournalArticle: (article: JournalArticle) => void;
}

// Helper function to extract mood/emotional themes from journal articles
const extractMoodThemes = (journalArticles: JournalArticle[]): string[] => {
    if (!journalArticles.length) return [];
    const moodCount: Record<string, number> = {};
    journalArticles.forEach(article => {
      const mood = article.triggering_mood;
      if (mood) {
        moodCount[mood] = (moodCount[mood] || 0) + 1;
      }
    });
    return Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);
};

// Get personalized recommendation cards based on journal entries
const getRecommendationCardsData = (journalArticles: JournalArticle[]): RecommendationCardData[] => {
    const moodThemes = extractMoodThemes(journalArticles);

    // Default cards if no journal data or themes extracted
    if (moodThemes.length === 0) {
      return [
        { displayTitle: "Recommended For You", title: "Managing Anxiety", description: "Explore strategies that may help with anxiety symptoms.", gradient: "from-blue-500 to-indigo-600", action: "Read Now", theme: "anxiety" },
        { displayTitle: "Personalized", title: "Sleep Improvement", description: "Discover evidence-based techniques to help improve sleep quality.", gradient: "from-pink-500 to-purple-600", action: "Explore", theme: "sleep" },
        { displayTitle: "Weekly Exercise", title: "Mindful Meditation", description: "Try a simple mindfulness practice to help with stress patterns.", gradient: "from-green-500 to-teal-600", action: "Start Now", theme: "mindfulness" }
      ];
    }

    const themeToGradient: Record<string, string> = {
      anxiety: "from-blue-500 to-indigo-600", depression: "from-indigo-600 to-purple-700",
      stress: "from-red-500 to-orange-500", sleep: "from-pink-500 to-purple-600",
      anger: "from-orange-500 to-red-600", sadness: "from-blue-400 to-blue-600",
      happiness: "from-yellow-400 to-orange-500", loneliness: "from-blue-600 to-blue-800",
      mindfulness: "from-green-500 to-teal-600", gratitude: "from-teal-500 to-green-600"
    };

    // Generate cards based on actual themes, providing fallbacks
    const cardThemes = [moodThemes[0] || 'emotions', moodThemes[1] || 'sleep', moodThemes[2] || 'mindfulness'];
    const cardTitles = [
        `Managing ${cardThemes[0]}`,
        moodThemes[1] ? `Coping with ${cardThemes[1]}` : "Sleep Improvement",
        moodThemes[2] ? `${cardThemes[2]} Support` : "Mindful Meditation"
    ];
    const cardDescriptions = [
        `Based on journal entries about ${cardThemes[0]}, these strategies may help.`,
        moodThemes[1] ? `Practical techniques to help manage ${cardThemes[1]} based on journal patterns.` : "Evidence-based techniques for mental wellbeing.",
        moodThemes[2] ? `Resources selected to help with ${cardThemes[2]} mentioned in your journal.` : "A simple mindfulness practice for emotional patterns."
    ];
    const displayTitles = ["Recommended For You", "Personalized", "Weekly Exercise"];

    return cardThemes.map((theme, index) => ({
      displayTitle: displayTitles[index],
      title: cardTitles[index],
      description: cardDescriptions[index],
      gradient: themeToGradient[theme] || "from-gray-500 to-gray-600", // Fallback gradient
      action: index === 0 ? "Read Now" : index === 1 ? "Explore" : "Start Now",
      theme: theme,
    }));
};


const JournalRecommendations: React.FC<JournalRecommendationsProps> = ({
  journalArticles,
  journalArticlesLoading,
  journalArticlesError,
  darkMode,
  onViewJournalArticle,
}) => {
  const primaryMoodTheme = journalArticles.length > 0 ? (extractMoodThemes(journalArticles)[0] || "common patterns") : "common patterns";
  const recommendationCards = getRecommendationCardsData(journalArticles);

  return (
    <div className="mt-12">
      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Based on Your Journal</h2>

      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        {journalArticlesLoading
          ? "Analyzing your journal entries to personalize recommendations..."
          : journalArticlesError
          ? "Personalized recommendations based on common emotional patterns."
          : journalArticles.length > 0
          ? `We've analyzed ${journalArticles.length} journal entries. Recommendations based on patterns related to ${primaryMoodTheme}.`
          : "Explore these resources tailored to common mental health needs."
        }
      </p>

      {journalArticlesLoading && (
        <div className="flex justify-center items-center py-8">
          <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
        </div>
      )}

      {!journalArticlesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendationCards.map((card, index) => (
            <RecommendationCard key={index} card={card} />
          ))}
        </div>
      )}

      {!journalArticlesLoading && journalArticles.length > 0 && (
        <div className="mt-10">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Your Recent Journal-Based Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalArticles.slice(0, 3).map((article) => (
              <JournalArticleCard
                key={article.id}
                article={article}
                darkMode={darkMode}
                onView={onViewJournalArticle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalRecommendations;