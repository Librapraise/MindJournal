"use client";

import React, { useState, useEffect } from "react";
import ArticleModal from "@/app/components/ArticleModal";
import { LucideIcon, Brain, Search, ArrowRight, BookOpen, Video, Headphones, Bookmark, Clock, Star, Filter, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/ThemeContext";

// Types for our resource data
type Resource = {
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

// Type for journal-related articles
type JournalArticle = {
  title: string;
  body: string;
  triggering_mood: string;
  generation_variation_key: string;
  id: number;
  user_id: string;
  generated_at: string;
  source_journal_entry_id: number;
};

type Category = {
  id: "article" | "video" | "audio" | "exercise";
  name: string;
  icon: LucideIcon;
  count: number;
};

export default function ResourcesPage() {

  // Helper to create a clean text snippet from HTML content
  const createSnippet = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    
    // Remove HTML tags to get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const { darkMode, toggleTheme } = useTheme();
  
  // Resource state variables
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State handler for journal-related articles
  const [journalArticles, setJournalArticles] = useState<JournalArticle[]>([]);
  const [journalArticlesLoading, setJournalArticlesLoading] = useState<boolean>(true);
  const [journalArticlesError, setJournalArticlesError] = useState<string | null>(null);

  // State for the article modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Resource | JournalArticle | null>(null);


// load saved resources 
useEffect(() => {
  const loadSavedResources = () => {
    try {
      const savedItemsStr = localStorage.getItem('savedResources');
      if (savedItemsStr) {
        const savedIds = JSON.parse(savedItemsStr);
        
        // Update resources 
        setResources(prevResources => 
          prevResources.map(resource => ({
            ...resource,
            isSaved: savedIds.includes(resource.id)
          }))
        );
        
        // update sample resources in case they're being used
        sampleResources.forEach(resource => {
          resource.isSaved = savedIds.includes(resource.id);
        });
      }
    } catch (err) {
      console.error("Error loading saved resources from localStorage:", err);
    }
  };
  
  // Load saved resources immediately when the component mounts
  loadSavedResources();
  

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'savedResources') {
      loadSavedResources();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}, []);


useEffect(() => {

  if (!loading && resources.length > 0) {
    try {
      const savedItemsStr = localStorage.getItem('savedResources');
      if (savedItemsStr) {
        const savedIds = JSON.parse(savedItemsStr);
        
        // Update resources with saved status from localStorage
        setResources(prevResources => 
          prevResources.map(resource => ({
            ...resource,
            isSaved: savedIds.includes(resource.id)
          }))
        );
      }
    } catch (err) {
      console.error("Error applying saved status after API load:", err);
    }
  }
}, [loading]); 


const toggleSaved = async (id: string) => {
  try {
    // Find the resource that's being toggled
    const resource = resources.find(r => r.id === id);
    if (!resource) return;
    
    const newSavedStatus = !resource.isSaved;
    
    setResources(prevResources => 
      prevResources.map(resource => 
        resource.id === id 
          ? { ...resource, isSaved: newSavedStatus } 
          : resource
      )
    );
    
    
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle({
        ...selectedArticle,
        isSaved: newSavedStatus
      });
    }
    
    console.log(`Toggling saved status for resource ${id} to ${newSavedStatus}`);
    
    // Update localStorage
    try {
      // Get current saved resources
      const savedItemsStr = localStorage.getItem('savedResources') || '[]';
      const savedItems = JSON.parse(savedItemsStr);
      
      // Update the saved items array based on new status
      let updatedSavedItems;
      if (newSavedStatus) {
        // Add to saved items if not already there
        if (!savedItems.includes(id)) {
          updatedSavedItems = [...savedItems, id];
        } else {
          updatedSavedItems = savedItems;
        }
      } else {
        // Remove from saved items
        updatedSavedItems = savedItems.filter((itemId: string) => itemId !== id);
      }
      
      // Save back to localStorage
      localStorage.setItem('savedResources', JSON.stringify(updatedSavedItems));
      
      console.log(`Successfully saved resource ${id} to localStorage`);
    } catch (storageError) {
      console.error("Error updating localStorage:", storageError);
      
      // Rollback the state update on storage failure
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === id 
            ? { ...resource, isSaved: !newSavedStatus } 
            : resource
        )
      );
      
      // Also rollback the selected article if needed
      if (selectedArticle && selectedArticle.id === id) {
        setSelectedArticle({
          ...selectedArticle,
          isSaved: !newSavedStatus
        });
      }
      
      alert("Failed to save your preference. Please try again.");
    }
  } catch (err) {
    console.error("Error in toggle saved function:", err);
  }
};

  // Open the article modal with the selected resource
  const openResourceModal = (resource: Resource) => {
    setSelectedArticle(resource);
    setModalOpen(true);
  };


  // Open the journal article modal with the selected article
  const openJournalArticleModal = (article: JournalArticle) => {
    // Convert journal article to resource format for consistent modal display
    const formattedArticle: Resource = {
      id: article.id.toString(),
      title: article.title,
      body: article.body,
      category: "article" as "article", // Explicitly cast to the correct type
      tags: [article.triggering_mood],
      duration: "5 min read", // Default value
      isSaved: false, // Journal articles don't have saved status
      rating: 0, // Journal articles don't have ratings
    };
    
    setSelectedArticle(formattedArticle);
    setModalOpen(true);
  };

  // Close the modal and reset selected article
  const closeModal = () => {
    setModalOpen(false);
    setSelectedArticle(null);
  };
  

  

  // Mock user ID - in a real app, this would come from authentication
  const currentUserId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  // Fetch resources from API when component mounts and when category changes
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        let apiEndpoint = "https://mentalheathapp.vercel.app/journal/articles/";

      // Get authentication token from localStorage (make sure it's set during login)
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
        
        // Add query parameters if needed
        const params = new URLSearchParams();
        if (activeCategory !== "all") {
          params.append("category", activeCategory);
        }
        
        // Add timeout to fetch to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
            signal: controller.signal,
            // Add these headers to help with CORS issues
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }
          
          let data = await response.json();
          
          // Check if the data has the expected structure
          if (!Array.isArray(data)) {
            console.warn("API did not return an array, using sample data instead");
            throw new Error("Invalid data format received from API");
          }
          
          // Transform API data to match our Resource type if necessary
          const transformedResources: Resource[] = data.map((item: any) => ({
            id: (item.id || Math.random().toString(36).substr(2, 9)).toString(),
            title: item.title || "Unknown Title",
            body: item.body || "No description available",
            category: (item.category as "article" | "video" | "audio" | "exercise") || "article",
            tags: item.tags || [],  
            duration: item.duration || "5 min read",
            isSaved: item.isSaved || false,
            rating: item.rating || 4.5,
            imageUrl: item.imageUrl || item.image_url
          }));
          
          setResources(transformedResources);
          setError(null);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }
      } catch (err) {
        console.error("Error fetching resources:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load resources: ${errorMessage}. Using sample data instead.`);
        
        // Fall back to sample data in case API fails
        setResources(sampleResources);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [activeCategory]);

  // Fetch journal-related articles for the specific user
  useEffect(() => {
    const fetchJournalArticles = async () => {
      setJournalArticlesLoading(true);
      try {
        const apiEndpoint = "https://mentalheathapp.vercel.app/journal/articles/";
        
      // Get authentication token from localStorage (make sure it's set during login)
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
        // Add user_id as a query parameter
        const params = new URLSearchParams();
        params.append("user_id", currentUserId);
        
        // Add timeout to fetch to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
            signal: controller.signal,
            // Add these headers to help with CORS issues
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          // Debug response information
          console.log(`Journal API Response: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch journal articles: ${response.status} ${response.statusText}`);
          }
          
          // For debugging - log the raw response text if needed
          // const responseText = await response.text();
          // console.log("Raw API response:", responseText);
          // const data = responseText ? JSON.parse(responseText) : [];
          
          const data = await response.json();
          
          // Validate data structure
          if (!Array.isArray(data)) {
            console.warn("Journal API did not return an array");
            // Try to handle non-array responses (could be an object with data inside)
            const processedData = Array.isArray(data.results) ? data.results : 
                                 (data.data && Array.isArray(data.data)) ? data.data : 
                                 []; // Empty array as fallback
            
            setJournalArticles(processedData);
          } else {
            setJournalArticles(data);
          }
          
          setJournalArticlesError(null);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }
      } catch (err) {
        console.error("Error fetching journal articles:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setJournalArticlesError(`Failed to load personalized articles: ${errorMessage}`);
        
        // Create some sample journal entries for development purposes
        const sampleJournalArticles: JournalArticle[] = [
          {
            id: 1,
            title: "Managing Anxiety",
            body: "This article provides techniques to help with anxiety symptoms mentioned in your journal entries.",
            triggering_mood: "anxiety",
            generation_variation_key: "anxiety_management",
            user_id: currentUserId,
            generated_at: new Date().toISOString(),
            source_journal_entry_id: 101
          },
          {
            id: 2,
            title: "Sleep Improvement Strategies",
            body: "Based on your journal entries about sleep difficulties, try these evidence-based techniques.",
            triggering_mood: "sleep",
            generation_variation_key: "sleep_improvement",
            user_id: currentUserId,
            generated_at: new Date().toISOString(),
            source_journal_entry_id: 102
          },
          {
            id: 3,
            title: "Mindfulness for Stress",
            body: "Your journal entries mention stress patterns. These mindfulness practices can help reduce stress.",
            triggering_mood: "stress",
            generation_variation_key: "stress_reduction",
            user_id: currentUserId,
            generated_at: new Date().toISOString(),
            source_journal_entry_id: 103
          }
        ];
        
        // Set sample data for development
        setJournalArticles(sampleJournalArticles);
      } finally {
        setJournalArticlesLoading(false);
      }
    };

    fetchJournalArticles();
  }, [currentUserId]);

  // Sample resource data as fallback
  const sampleResources: Resource[] = [
    {
      id: "1",
      title: "Understanding Anxiety: A Comprehensive Guide",
      body: "Learn about the different types of anxiety disorders, their symptoms, and effective coping strategies.",
      category: "article",
      tags: ["anxiety", "mental health", "self-help"],
      duration: "15 min read",
      isSaved: true,
      rating: 4.8
    },
    {
      id: "2",
      title: "5-Minute Mindfulness Meditation",
      body: "A quick guided meditation practice that you can do anywhere to reduce stress and increase focus.",
      category: "audio",
      tags: ["meditation", "mindfulness", "stress relief"],
      duration: "5 min",
      isSaved: false,
      rating: 4.5
    },
    {
      id: "3",
      title: "Progressive Muscle Relaxation Technique",
      body: "A guided exercise to help you release physical tension and promote deep relaxation.",
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
      body: "A structured journaling exercise to help cultivate gratitude and positive thinking.",
      category: "exercise",
      tags: ["gratitude", "positivity", "journaling"],
      duration: "10 min",
      isSaved: false,
      rating: 4.6
    },
    {
      id: "5",
      title: "The Science of Sleep and Mental Health",
      body: "Explore the crucial relationship between sleep quality and mental wellbeing, with practical tips for better sleep.",
      category: "article",
      tags: ["sleep", "mental health", "wellness"],
      duration: "20 min read",
      isSaved: false,
      rating: 4.9
    },
    {
      id: "6",
      title: "Breathwork for Stress Management",
      body: "Learn three powerful breathing techniques that can help you manage stress and anxiety in the moment.",
      category: "video",
      tags: ["breathing", "stress", "anxiety"],
      duration: "8 min",
      isSaved: true,
      rating: 4.7,
      imageUrl: "/api/placeholder/400/225"
    }
  ];

 

  // Helper function to extract mood/emotional themes from journal articles
  const extractMoodThemes = () => {
    if (!journalArticles.length) return [];
    
    // Count occurrences of each mood
    const moodCount: Record<string, number> = {};
    journalArticles.forEach(article => {
      const mood = article.triggering_mood;
      if (mood) {
        moodCount[mood] = (moodCount[mood] || 0) + 1;
      }
    });
    
    // Get top 3 moods
    return Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);
  };

  // Get primary mood theme for recommendations
  const primaryMoodTheme = journalArticles.length > 0 ? 
    extractMoodThemes()[0] || "anxiety" : 
    "anxiety";

  // Get personalized recommendation cards based on journal entries
  const getRecommendationCards = () => {
    // Default cards if no journal data
    if (journalArticles.length === 0) {
      return [
        {
          title: "Managing Anxiety",
          description: "Based on your recent journal entries, these strategies may help with anxiety symptoms you've mentioned.",
          gradient: "from-blue-500 to-indigo-600",
          action: "Read Now",
          theme: "anxiety"
        },
        {
          title: "Sleep Improvement",
          description: "Your journal entries mention sleep challenges. These evidence-based techniques can help improve sleep quality.",
          gradient: "from-pink-500 to-purple-600",
          action: "Explore",
          theme: "sleep"
        },
        {
          title: "Mindful Meditation",
          description: "A simple 5-minute mindfulness practice to help with the stress patterns mentioned in your journal.",
          gradient: "from-green-500 to-teal-600",
          action: "Start Now",
          theme: "mindfulness"
        }
      ];
    }
    
    // Extract real themes from journal entries
    const moodThemes = extractMoodThemes();
    
    // Recommendation cards based on actual mood themes
    const themeToGradient: Record<string, string> = {
      anxiety: "from-blue-500 to-indigo-600",
      depression: "from-indigo-600 to-purple-700",
      stress: "from-red-500 to-orange-500",
      sleep: "from-pink-500 to-purple-600",
      anger: "from-orange-500 to-red-600",
      sadness: "from-blue-400 to-blue-600",
      happiness: "from-yellow-400 to-orange-500",
      loneliness: "from-blue-600 to-blue-800",
      mindfulness: "from-green-500 to-teal-600",
      gratitude: "from-teal-500 to-green-600"
    };
    
    // Generate cards based on actual themes
    return [
      {
        title: `Managing ${moodThemes[0] || "Emotions"}`,
        description: `Based on your recent journal entries about ${moodThemes[0] || "emotions"}, these strategies may help with symptoms you've mentioned.`,
        gradient: themeToGradient[moodThemes[0]] || "from-blue-500 to-indigo-600",
        action: "Read Now",
        theme: moodThemes[0] || "emotions"
      },
      {
        title: moodThemes[1] ? `Coping with ${moodThemes[1]}` : "Sleep Improvement",
        description: moodThemes[1] ? 
          `Practical techniques to help manage ${moodThemes[1]} based on your journal patterns.` :
          "Evidence-based techniques that can help improve your mental wellbeing.",
        gradient: moodThemes[1] ? themeToGradient[moodThemes[1]] || "from-pink-500 to-purple-600" : "from-pink-500 to-purple-600",
        action: "Explore",
        theme: moodThemes[1] || "sleep"
      },
      {
        title: moodThemes[2] ? `${moodThemes[2]} Support` : "Mindful Meditation",
        description: moodThemes[2] ?
          `Resources specifically selected to help with ${moodThemes[2]} mentioned in your journal.` :
          "A simple mindfulness practice to help with emotional patterns mentioned in your journal.",
        gradient: moodThemes[2] ? themeToGradient[moodThemes[2]] || "from-green-500 to-teal-600" : "from-green-500 to-teal-600",
        action: "Start Now",
        theme: moodThemes[2] || "mindfulness"
      }
    ];
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
        !resource.body.toLowerCase().includes(searchQuery.toLowerCase()) &&
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
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>{createSnippet(resource.body)}</p>
                    
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
                        <button 
                          className={`flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium text-sm hover:text-indigo-800`}
                          onClick={() => openResourceModal(resource)}
                        >
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
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Based on Your Journal</h2>
          
          {/* Personalized journal analysis message */}
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            {journalArticlesLoading ? 
              "Analyzing your journal entries to personalize recommendations..." :
              journalArticlesError ? 
                "Personalized recommendations based on common emotional patterns." :
                journalArticles.length > 0 ?
                  `We've analyzed ${journalArticles.length} of your journal entries to identify patterns related to ${primaryMoodTheme}.` :
                  "Explore these resources tailored to common mental health needs."
            }
          </p>
          
          {/* Loading state for journal recommendations */}
          {journalArticlesLoading && (
            <div className="flex justify-center items-center py-8">
              <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-500'}`}></div>
            </div>
          )}
          
          {/* Journal recommendations */}
          {!journalArticlesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getRecommendationCards().map((card, index) => (
                <div key={index} className={`bg-gradient-to-r ${card.gradient} rounded-lg shadow-md text-white p-6`}>
                  <h3 className="font-medium text-lg mb-2">
                    {index === 0 ? "Recommended For You" : 
                     index === 1 ? "Personalized" : "Weekly Exercise"}
                  </h3>
                  <h4 className="font-bold text-xl mb-3">{card.title}</h4>
                  <p className="text-blue-50 mb-4">
                    {card.description}
                  </p>
                  <button className="flex items-center text-white font-medium cursor-pointer">
                    {card.action} <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Journal Articles List - if you want to show the actual articles */}
          {!journalArticlesLoading && journalArticles.length > 0 && (
            <div className="mt-10">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Your Recent Journal-Based Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {journalArticles.slice(0, 3).map((article) => (
                  <div key={article.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden p-5`}>
                    <div className="flex items-center mb-3">
                      <Brain className="w-6 h-6 text-indigo-500" />
                      <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                        Based on "{article.triggering_mood}" Entry
                      </span>
                    </div>
                    
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{article.title}</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>
                      {article.body.substring(0, 120)}...
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Generated: {new Date(article.generated_at).toLocaleDateString()}
                      </span>
                      <button 
                        className={`flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium text-sm hover:text-indigo-800`}
                        onClick={() => openJournalArticleModal(article)}
                      >
                        Read Full Article
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Modal */}
          <ArticleModal 
            isOpen={modalOpen}
            onClose={closeModal}
            article={selectedArticle ? {
              ...selectedArticle,
              id: selectedArticle.id.toString(), // Convert id to string
              category: (selectedArticle as Resource).category || "article",
              isSaved: (selectedArticle as Resource).isSaved || false,
              tags: (selectedArticle as Resource).tags || [],
              duration: (selectedArticle as Resource).duration || "N/A",
              rating: (selectedArticle as Resource).rating || 0,
              imageUrl: (selectedArticle as Resource).imageUrl || ""
            } : null}
            onBookmark={toggleSaved}
          />
        </div>
      </main>
    </div>
  );    
}