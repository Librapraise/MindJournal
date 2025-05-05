"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import ArticleModal from "@/app/components/ArticleModal"; 
import { BookOpen, Video, Headphones, LucideIcon } from "lucide-react"; 
import { useTheme } from "@/app/ThemeContext";


import PageHeader from '../components/resources/PageHeader'; 
import ResourceFilters from '../components/resources/ResourceFilters';
import CategoryTabs from '../components/resources/CategoryTabs';
import ResourceGrid from '../components/resources/ResourceGrid';
import JournalRecommendations from '../components/resources/JournalRecommendations';

// Import types and utils
import { Resource, JournalArticle, Category } from '@/app/utils/resourceUtils';

// Sample data (keep as fallback)
const sampleResources: Resource[] = [
    { id: "1", title: "Understanding Anxiety", body: "...", category: "article", tags: ["anxiety"], duration: "15 min read", isSaved: false, rating: 4.8 },
    { id: "2", title: "Mindfulness Meditation", body: "...", category: "audio", tags: ["meditation"], duration: "5 min", isSaved: false, rating: 4.5 },
    // Add more sample data if needed
];

export default function ResourcesPage() {
  const { darkMode, toggleTheme } = useTheme();

  // --- State Management ---
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [savedOnly, setSavedOnly] = useState<boolean>(false);

  // Resource state
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Journal Article state
  const [journalArticles, setJournalArticles] = useState<JournalArticle[]>([]);
  const [journalArticlesLoading, setJournalArticlesLoading] = useState<boolean>(true);
  const [journalArticlesError, setJournalArticlesError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // Use a union type for selected article
  const [selectedArticle, setSelectedArticle] = useState<Resource | JournalArticle | null>(null);

  // Mock user ID - replace with actual auth logic
  const currentUserId = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // TODO: Replace with actual user ID

  // --- Data Fetching Hooks ---

  // Fetch General Resources
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null); // Reset error on new fetch
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setResources(sampleResources); // Use fallback
        setLoading(false);
        return;
      }

      try {
        let apiEndpoint = "https://mentalheathapp.vercel.app/journal/articles/"; // Update if endpoint differs for general resources
        const params = new URLSearchParams();
        // NOTE: The original code fetches from /journal/articles/ for *both* general resources and journal articles.
        // If there's a different endpoint for general resources (e.g., /resources/), update apiEndpoint here.
        // If filtering general resources by category is supported by the API:
        // if (activeCategory !== "all") {
        //   params.append("category", activeCategory);
        // }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout

        const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`API Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format received");

        // Transform data ONLY IF NEEDED - API structure might match Resource type already
        const transformedResources: Resource[] = data.map((item: any): Resource => ({
            id: item.id?.toString() ?? Math.random().toString(36).substr(2, 9), // Ensure ID is string and exists
            title: item.title || "Untitled Resource",
            body: item.body || "No description.",
            // Validate category or default
            category: ["article", "video", "audio", "exercise"].includes(item.category) ? item.category : "article",
            tags: Array.isArray(item.tags) ? item.tags : [],
            duration: item.duration || "5 min read",
            isSaved: item.isSaved || false, // Will be overridden by localStorage later
            rating: typeof item.rating === 'number' ? item.rating : 4.0,
            imageUrl: item.imageUrl || item.image_url // Check both possible names
        }));

        setResources(transformedResources);

      } catch (err: any) {
        console.error("Error fetching resources:", err);
        setError(`Failed to load resources: ${err.message}. Displaying sample data.`);
        setResources(sampleResources); // Use fallback
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
    // Dependency: Re-fetch ONLY if the category filter changes AND the API supports it.
    // If the API endpoint doesn't filter by category, remove activeCategory dependency.
    }, [activeCategory]); // Or just [] if API doesn't filter by category

    // Fetch Journal-Specific Articles
    useEffect(() => {
        const fetchJournalArticles = async () => {
          setJournalArticlesLoading(true);
          setJournalArticlesError(null);
          const token = localStorage.getItem('token');
          if (!token) {
            setJournalArticlesError("Authentication required for personalized articles.");
            setJournalArticles([]); // Clear or set sample if desired
            setJournalArticlesLoading(false);
            return;
          }

          try {
            const apiEndpoint = "https://mentalheathapp.vercel.app/journal/articles/";
            const params = new URLSearchParams({ user_id: currentUserId });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
              signal: controller.signal,
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`API Error ${response.status}: ${response.statusText}`);

            const data = await response.json();
            // Handle potential nested data structures
             const articlesData = Array.isArray(data) ? data :
                                Array.isArray(data.results) ? data.results :
                                Array.isArray(data.data) ? data.data : [];

            // Basic validation of fetched journal articles
            const validArticles = articlesData.filter((item: any) => item && item.id && item.title);
            setJournalArticles(validArticles);

          } catch (err: any) {
            console.error("Error fetching journal articles:", err);
            setJournalArticlesError(`Failed to load personalized articles: ${err.message}.`);
            setJournalArticles([]); // Clear articles on error
            // Optionally set sample journal articles here for development
          } finally {
            setJournalArticlesLoading(false);
          }
        };

        if (currentUserId) {
          fetchJournalArticles();
        } else {
            setJournalArticlesError("User ID not available.");
            setJournalArticlesLoading(false);
        }
      }, [currentUserId]); // Dependency on user ID

    // --- Local Storage Sync for Saved Status ---
    useEffect(() => {
        const loadSavedStatus = () => {
          try {
            const savedItemsStr = localStorage.getItem('savedResources');
            const savedIds: string[] = savedItemsStr ? JSON.parse(savedItemsStr) : [];

            setResources(prev => prev.map(r => ({ ...r, isSaved: savedIds.includes(r.id) })));

            // Update sample resources too, in case they are displayed due to error
            sampleResources.forEach(sr => { sr.isSaved = savedIds.includes(sr.id); });

          } catch (err) {
            console.error("Error loading saved status from localStorage:", err);
          }
        };

        loadSavedStatus(); // Load on mount

        // Listen for changes in other tabs/windows
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'savedResources') {
            loadSavedStatus();
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      }, []); // Run only once on mount

      // Apply saved status after API data loads/changes
      useEffect(() => {
        if (!loading && resources.length > 0) {
             try {
                const savedItemsStr = localStorage.getItem('savedResources');
                const savedIds: string[] = savedItemsStr ? JSON.parse(savedItemsStr) : [];
                setResources(prev => prev.map(r => ({ ...r, isSaved: savedIds.includes(r.id) })));
            } catch (err) {
                console.error("Error applying saved status after API load:", err);
            }
        }
      }, [loading, resources.length]); // Re-apply when loading finishes or resource list changes fundamentally


    // --- Event Handlers ---
    const toggleSaved = useCallback(async (id: string) => {
        let previousState: Resource[] | undefined;
        let previousSelectedArticleState: Resource | JournalArticle | null | undefined;

        try {
            previousState = [...resources]; // Store previous state for rollback
            previousSelectedArticleState = selectedArticle ? { ...selectedArticle } : null;

            const targetResource = resources.find(r => r.id === id);
            if (!targetResource) return;
            const newSavedStatus = !targetResource.isSaved;

            // Optimistically update UI state
            setResources(prev =>
                prev.map(r => (r.id === id ? { ...r, isSaved: newSavedStatus } : r))
            );
            if (selectedArticle && 'id' in selectedArticle && selectedArticle.id === id) {
                // Ensure selectedArticle is treated as Resource for isSaved property
                setSelectedArticle((prev: Resource | JournalArticle | null) => {
                    if (prev && 'isSaved' in prev) {
                        return { ...prev, isSaved: newSavedStatus } as Resource;
                    }
                    return prev;
                });
            }

            // Update localStorage
            const savedItemsStr = localStorage.getItem('savedResources') || '[]';
            const savedItems: string[] = JSON.parse(savedItemsStr);
            const updatedSavedItems = newSavedStatus
                ? [...new Set([...savedItems, id])] // Add (ensure uniqueness)
                : savedItems.filter((itemId: string) => itemId !== id); // Remove

            localStorage.setItem('savedResources', JSON.stringify(updatedSavedItems));

        } catch (err) {
            console.error("Error toggling save status:", err);
            // Rollback UI on error
            if (previousState) setResources(previousState);
             if (previousSelectedArticleState !== undefined) setSelectedArticle(previousSelectedArticleState);
            alert("Failed to update save status. Please try again.");
        }
    }, [resources, selectedArticle]);

    const openResourceModal = useCallback((resource: Resource) => {
        setSelectedArticle(resource);
        setModalOpen(true);
    }, []);

    const openJournalArticleModal = useCallback((article: JournalArticle) => {
        // No need to format anymore if modal handles JournalArticle type
        setSelectedArticle(article);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setSelectedArticle(null);
    }, []);

    const handleRetryFetch = useCallback(() => {
      // Re-trigger the fetch useEffect by resetting loading state or changing a dependency
      // Simplest might be just to call the fetch function again, but useEffect handles this.
      // Let's reset the error and trigger a state change that useEffect depends on, if applicable.
      // Or, more directly, just set loading true to re-trigger the main resource fetch.
      setLoading(true);
      setError(null);
      // If activeCategory doesn't trigger refetch, you might need a dedicated 'retry' state.
  }, []);

    // --- Derived State ---
    const categories = useMemo((): Category[] => [
        { id: "article", name: "Articles", icon: BookOpen, count: resources.filter(r => r.category === "article").length },
        { id: "video", name: "Videos", icon: Video, count: resources.filter(r => r.category === "video").length },
        { id: "audio", name: "Audio", icon: Headphones, count: resources.filter(r => r.category === "audio").length },
        { id: "exercise", name: "Exercises", icon: BookOpen, count: resources.filter(r => r.category === "exercise").length } // Assuming exercise uses BookOpen
    ], [resources]);

    const filteredResources = useMemo(() => resources.filter(resource => {
        const categoryMatch = activeCategory === "all" || resource.category === activeCategory;
        const searchMatch = !searchQuery ||
            resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const savedMatch = !savedOnly || resource.isSaved;
        return categoryMatch && searchMatch && savedMatch;
    }), [resources, activeCategory, searchQuery, savedOnly]);

    // Prepare article data for the modal, handling both types
    const modalArticleData = useMemo(() => {
        if (!selectedArticle) return null;

        if ('category' in selectedArticle) { // It's a Resource
             return {
                 ...selectedArticle,
                 id: selectedArticle.id.toString(), // Ensure string id
            };
        } else { // It's a JournalArticle
            return {
                id: selectedArticle.id.toString(), // Ensure string id
                title: selectedArticle.title,
                body: selectedArticle.body,
                // Provide defaults for Resource fields not present in JournalArticle
                category: "article" as const,
                tags: [selectedArticle.triggering_mood],
                duration: "5 min read",
                isSaved: false, // Journal articles likely aren't 'saved' in the same way
                rating: 0,
                imageUrl: undefined, // No image assumed for journal articles
            };
        }
    }, [selectedArticle]);


    // --- Render ---
    return (
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-blue-50'} min-h-screen`}>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-64"> {/* Adjust padding if sidebar exists */}
                <PageHeader darkMode={darkMode} toggleTheme={toggleTheme} />

                <ResourceFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    savedOnly={savedOnly}
                    setSavedOnly={setSavedOnly}
                    darkMode={darkMode}
                />

                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    totalResources={resources.length} // Pass total count before filtering
                    darkMode={darkMode}
                />

                <ResourceGrid
                    resources={filteredResources}
                    loading={loading}
                    error={error}
                    darkMode={darkMode}
                    onBookmark={toggleSaved}
                    onView={openResourceModal}
                    onRetry={handleRetryFetch} // Pass retry handler
                />

                <JournalRecommendations
                    journalArticles={journalArticles}
                    journalArticlesLoading={journalArticlesLoading}
                    journalArticlesError={journalArticlesError}
                    darkMode={darkMode}
                    onViewJournalArticle={openJournalArticleModal}
                />

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
            </main>
        </div>
    );
}