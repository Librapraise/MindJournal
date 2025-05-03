"use client";

import React, { useState, useEffect } from "react";
import { LucideIcon, Brain, Search, ArrowRight, BookOpen, Video, Headphones, Bookmark, Clock, Star, Filter, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/ThemeContext";


// Types for our resource data
type Resource = {
  id: string;
  title: string;
  description: string;
  category: "article" | "video" | "audio" | "exercise";
  tags: string[];
  duration: string;
  isSaved: boolean;
  rating: number;
  imageUrl?: string;
};

type Category = {
  id: "article" | "video" | "audio" | "exercise";
  name: string;
  icon: LucideIcon;
  count: number;
};

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const { darkMode, toggleTheme } = useTheme();
  
  // Add new state variables for API integration
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resources from API when component mounts and when category changes
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        let apiEndpoint = "https://mentalheathapp.vercel.app/journal/articles/";
        
        // Add query parameters if needed
        const params = new URLSearchParams();
        if (activeCategory !== "all") {
          params.append("category", activeCategory);
        }
        
        const response = await fetch(`${apiEndpoint}?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch resources");
        }
        
        let data = await response.json();
        
        // Transform API data to match our Resource type if necessary
        const transformedResources: Resource[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category as "article" | "video" | "audio" | "exercise",
          tags: item.tags || [],  
          duration: item.duration || "5 min read",
          isSaved: item.isSaved || false,
          rating: item.rating || 4.5,
          imageUrl: item.imageUrl || item.image_url
        }));
        
        setResources(transformedResources);
        setError(null);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources. Using sample data instead.");
        
        // Fall back to sample data in case API fails
        setResources(sampleResources);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [activeCategory]);

  // Sample resource data as fallback
  const sampleResources: Resource[] = [
    {
      id: "1",
      title: "Understanding Anxiety: A Comprehensive Guide",
      description: "Learn about the different types of anxiety disorders, their symptoms, and effective coping strategies.",
      category: "article",
      tags: ["anxiety", "mental health", "self-help"],
      duration: "15 min read",
      isSaved: true,
      rating: 4.8
    },
    {
      id: "2",
      title: "5-Minute Mindfulness Meditation",
      description: "A quick guided meditation practice that you can do anywhere to reduce stress and increase focus.",
      category: "audio",
      tags: ["meditation", "mindfulness", "stress relief"],
      duration: "5 min",
      isSaved: false,
      rating: 4.5
    },
    {
      id: "3",
      title: "Progressive Muscle Relaxation Technique",
      description: "A guided exercise to help you release physical tension and promote deep relaxation.",
      category: "video",
      tags: ["relaxation", "anxiety", "sleep"],
      duration: "12 min",
      isSaved: true,
      rating: 4.7,
      imageUrl: "/api/placeholder/400/225"
    },
    {
      id: "4",
      title: "Gratitude Journaling Exercise",
      description: "A structured journaling exercise to help cultivate gratitude and positive thinking.",
      category: "exercise",
      tags: ["gratitude", "positivity", "journaling"],
      duration: "10 min",
      isSaved: false,
      rating: 4.6
    },
    {
      id: "5",
      title: "The Science of Sleep and Mental Health",
      description: "Explore the crucial relationship between sleep quality and mental wellbeing, with practical tips for better sleep.",
      category: "article",
      tags: ["sleep", "mental health", "wellness"],
      duration: "20 min read",
      isSaved: false,
      rating: 4.9
    },
    {
      id: "6",
      title: "Breathwork for Stress Management",
      description: "Learn three powerful breathing techniques that can help you manage stress and anxiety in the moment.",
      category: "video",
      tags: ["breathing", "stress", "anxiety"],
      duration: "8 min",
      isSaved: true,
      rating: 4.7,
      imageUrl: "/api/placeholder/400/225"
    }
  ];

  // Toggle saved status of a resource
  const toggleSaved = async (id: string) => {
    try {
      // In a real app, this would make an API call to save the resource
      // const response = await fetch(`/api/journal/resources/${id}/save`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });
      // if (!response.ok) throw new Error('Failed to save resource');
      
      // Update local state optimistically
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === id 
            ? { ...resource, isSaved: !resource.isSaved } 
            : resource
        )
      );
      
      console.log(`Toggle saved status for resource ${id}`);
    } catch (err) {
      console.error("Error saving resource:", err);
      // Could show an error toast here
    }
  };

  // Categories for filtering - dynamically calculated based on available resources
  const categories: Category[] = [
    { id: "article", name: "Articles", icon: BookOpen, count: resources.filter(r => r.category === "article").length },
    { id: "video", name: "Videos", icon: Video, count: resources.filter(r => r.category === "video").length },
    { id: "audio", name: "Audio", icon: Headphones, count: resources.filter(r => r.category === "audio").length },
    { id: "exercise", name: "Exercises", icon: BookOpen, count: resources.filter(r => r.category === "exercise").length }
  ];

  // Filter resources based on active filters
  const filteredResources = resources.filter(resource => {
    // Filter by category
    if (activeCategory !== "all" && resource.category !== activeCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !resource.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Filter by saved status
    if (savedOnly && !resource.isSaved) {
      return false;
    }
    
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "article":
        return <BookOpen className="w-6 h-6 text-blue-500" />;
      case "video":
        return <Video className="w-6 h-6 text-red-500" />;
      case "audio":
        return <Headphones className="w-6 h-6 text-purple-500" />;
      case "exercise":
        return <BookOpen className="w-6 h-6 text-green-500" />;
      default:
        return <BookOpen className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-blue-50'} min-h-screen`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-64">
        <div className="flex justify-between items-center mb-6 mt-6 lg:mt-0">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mental Health Resources</h2>
          <button
            onClick={toggleTheme}
            className={`cursor-pointer p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-colors`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                className={`pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                  savedOnly 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 border border-gray-700' 
                      : 'bg-white text-gray-700 border border-gray-300'
                }`}
                onClick={() => setSavedOnly(!savedOnly)}
              >
                <Bookmark className={`h-4 w-4 ${savedOnly ? 'text-indigo-700' : darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
                Saved
              </button>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                darkMode 
                  ? 'bg-gray-800 text-gray-300 border border-gray-700' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}>
                <Filter className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`} />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
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
              All Resources ({resources.length})
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className={`text-center py-8 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
            <p>{error}</p>
            <button 
              className={`mt-4 px-4 py-2 ${darkMode ? 'bg-indigo-700' : 'bg-indigo-600'} text-white rounded-lg hover:opacity-90`}
              onClick={() => setLoading(true)} // This will trigger the useEffect to re-fetch
            >
              Try Again
            </button>
          </div>
        )}

        {/* Resources grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <div key={resource.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
                  {resource.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img src={resource.imageUrl} alt={resource.title} className="w-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center mb-3">
                      {getCategoryIcon(resource.category)}
                      <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{resource.category}</span>
                      <div className="ml-auto flex items-center">
                        <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mr-1`} />
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{resource.duration}</span>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{resource.title}</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>{resource.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className={`text-xs px-2 py-1 ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-100 text-gray-600'
                          } rounded-full`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resource.rating}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          className={`p-2 ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'}`}
                          onClick={() => toggleSaved(resource.id)}
                        >
                          <Bookmark 
                            className={`h-5 w-5 ${
                              resource.isSaved 
                                ? 'text-indigo-600 fill-indigo-600' 
                                : darkMode 
                                  ? 'text-gray-400' 
                                  : 'text-gray-400'
                            }`} 
                          />
                        </button>
                        <button className={`flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium text-sm hover:text-indigo-800`}>
                          View
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`col-span-3 flex flex-col items-center justify-center py-12 px-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Search className={`h-12 w-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>No resources found</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Journal-based recommendations section */}
        <div className="mt-12">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Based on Your Journal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md text-white p-6">
              <h3 className="font-medium text-lg mb-2">Recommended For You</h3>
              <h4 className="font-bold text-xl mb-3">Managing Anxiety</h4>
              <p className="text-blue-50 mb-4">
                Based on your recent journal entries, these strategies may help with anxiety symptoms you've mentioned.
              </p>
              <button className="flex items-center text-white font-medium cursor-pointer">
                Read Now <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-md text-white p-6">
              <h3 className="font-medium text-lg mb-2">Personalized</h3>
              <h4 className="font-bold text-xl mb-3">Sleep Improvement</h4>
              <p className="text-pink-50 mb-4">
                Your journal entries mention sleep challenges. These evidence-based techniques can help improve sleep quality.
              </p>
              <button className="flex items-center text-white font-medium cursor-pointer">
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg shadow-md text-white p-6">
              <h3 className="font-medium text-lg mb-2">Weekly Exercise</h3>
              <h4 className="font-bold text-xl mb-3">Mindful Meditation</h4>
              <p className="text-green-50 mb-4">
                A simple 5-minute mindfulness practice to help with the stress patterns mentioned in your journal.
              </p>
              <button className="flex items-center text-white font-medium cursor-pointer">
                Start Now <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );    
}