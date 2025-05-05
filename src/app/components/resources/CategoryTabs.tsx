// src/app/resources/components/CategoryTabs.tsx
import React from 'react';
import { Category } from '@/app/utils/resourceUtils'; // Adjust the import path as necessary

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (categoryId: string) => void;
  totalResources: number;
  darkMode: boolean;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  totalResources,
  darkMode,
}) => {
  return (
    <div className="mb-6">
      <div className="flex overflow-x-auto space-x-2 pb-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
            activeCategory === "all"
              ? 'bg-indigo-100 text-indigo-700'
              : darkMode
              ? 'bg-gray-800 text-gray-300 border border-gray-700'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
          onClick={() => setActiveCategory("all")}
        >
          All Resources ({totalResources})
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-indigo-100 text-indigo-700'
                : darkMode
                ? 'bg-gray-800 text-gray-300 border border-gray-700'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {React.createElement(category.icon, { className: "w-5 h-5" })}
            <span className="ml-1">{category.name} ({category.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;