import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ChatResponse, Paper } from '../services/api';

interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  data: any; // Using 'any' to prevent TS errors with trimmed data
}

interface LibraryContextType {
  history: HistoryItem[];
  bookmarks: Paper[];
  saveToHistory: (query: string, data: ChatResponse) => void;
  toggleBookmark: (paper: Paper) => void;
  isBookmarked: (url: string) => boolean;
  clearHistory: () => void;
  resetAppData: () => void; // NEW: Function to wipe everything
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('rq_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading history", e);
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState<Paper[]>(() => {
    try {
      const saved = localStorage.getItem('rq_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading bookmarks", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rq_history', JSON.stringify(history));
    } catch (e) {
      console.error("LocalStorage full! History not saved.", e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('rq_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error("LocalStorage full! Bookmarks not saved.", e);
    }
  }, [bookmarks]);

  const saveToHistory = (query: string, data: ChatResponse) => {
    if (!data) return; // Don't save if data is missing

    // Trim data to prevent LocalStorage quota exceeded errors
    const essentialData = {
      refined_query: data.refined_query,
      papers: data.papers.map(p => ({
        title: p.title,
        url: p.url,
        source: p.source,
        summary: p.summary
      })),
      gap_analysis: data.gap_analysis,
      ideas: data.ideas
    };

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      data: essentialData
    };
    
    console.log("Saving to history:", query); // Debug log
    setHistory(prev => [newItem, ...prev].slice(0, 10)); 
  };

  const toggleBookmark = (paper: Paper) => {
    setBookmarks(prev => {
      const exists = prev.find(p => p.url === paper.url);
      if (exists) return prev.filter(p => p.url !== paper.url);
      return [paper, ...prev];
    });
  };

  const isBookmarked = (url: string) => bookmarks.some(p => p.url === url);
  const clearHistory = () => setHistory([]);
  
  // NEW: Wipe everything
  const resetAppData = () => {
    localStorage.clear();
    setHistory([]);
    setBookmarks([]);
    window.location.reload();
  };

  return (
    <LibraryContext.Provider value={{ history, bookmarks, saveToHistory, toggleBookmark, isBookmarked, clearHistory, resetAppData }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};