// src/app/resources/components/RecommendationCard.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

// Define a type for the card data structure
export type RecommendationCardData = {
  title: string;
  description: string;
  gradient: string;
  action: string;
  theme: string; // Added theme for potential click handling
  displayTitle: string; // The title like "Recommended For You"
};

interface RecommendationCardProps {
  card: RecommendationCardData;
  // Add onClick prop if these cards become interactive
  // onClick: (theme: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ card }) => {
  return (
    <div className={`bg-gradient-to-r ${card.gradient} rounded-lg shadow-md text-white p-6 flex flex-col`}>
      <h3 className="font-medium text-lg mb-2">
        {card.displayTitle}
      </h3>
      <h4 className="font-bold text-xl mb-3">{card.title}</h4>
      <p className="text-blue-50 mb-4 flex-grow">
        {card.description}
      </p>
      {/* Make this a real button/link if it does something */}
      <button className="flex items-center text-white font-medium cursor-pointer mt-auto self-start">
        {card.action} <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
};

export default RecommendationCard;