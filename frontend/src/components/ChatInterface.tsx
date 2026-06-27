import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { sendChatQuery } from '../services/api';
import { useLibrary } from '../context/LibraryContext';
import posthog from 'posthog-js';
import type { ChatResponse } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: ChatResponse;
  isError?: boolean; 
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to ResearchIQ. Enter a project idea, and I will find relevant papers, summarize them, and analyze research gaps.'
};

export const ChatInterface: React.FC = () => {
  const { saveToHistory } = useLibrary();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  useEffect(() => {
    const handleRestoreSearch = (event: CustomEvent) => {
      const item = event.detail;
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'user', 
        content: item.query 
      }, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Here is the comprehensive research analysis for "${item.query}".`,
        data: item.data
      }]);
    };

    window.addEventListener('restoreSearch', handleRestoreSearch as EventListener);
    return () => window.removeEventListener('restoreSearch', handleRestoreSearch as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const data = await sendChatQuery(userQuery);
      
      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `Analysis complete for "${userQuery}".`,
        data 
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      try {
        saveToHistory(userQuery, data);
        posthog.capture('research_search_performed', {
          query: userQuery,
          refined_query: data.refined_query,
          papers_found: data.papers.length
        });
      } catch (err) {
        console.warn("Failed to save to history (Storage might be full):", err);
      }

    } catch (error: any) {
      let errorMessage = "⚠️ An unexpected error occurred. Please ensure the backend is running and try again.";
      
      if (error?.response?.status === 404 || error?.message?.includes("404")) {
        errorMessage = "🔍 **No Relevant Papers Found**\n\nI searched our academic databases but couldn't find papers that perfectly match this specific topic. \n\n**Suggestions:**\n• Try broadening your search terms.\n• Use more general keywords related to your field.\n• Check for typos in your project idea.";
      } else if (error?.response?.status === 429 || error?.message?.includes("429")) {
        errorMessage = "⏳ **Rate Limit Reached**\n\nYou are searching a bit too fast! Our academic databases need a quick breather to prevent blocking. \n\nPlease wait about 60 seconds and try your search again.";
      } else if (error?.response?.status === 503 || error?.message?.includes("503")) {
        errorMessage = "🤖 **AI Assistant Unavailable**\n\nOur AI analysis engine is currently overwhelmed or undergoing maintenance. \n\nPlease try again in a few moments.";
      } else if (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError")) {
        errorMessage = "🔌 **Connection Lost**\n\nI cannot reach the ResearchIQ backend server. \n\n**Troubleshooting:**\n• Ensure your FastAPI backend is running (`uvicorn main:app --reload`).\n• Check your internet connection.";
      }

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: errorMessage,
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* 3D Parallax Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/[0.03] blur-[150px] rounded-full"
          style={{ transform: 'translateZ(-100px) scale(1.5)', animation: 'float 20s ease-in-out infinite' }}
        />
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-purple-500/[0.04] blur-[120px] rounded-full"
          style={{ transform: 'translateZ(-50px)', animation: 'float 15s ease-in-out infinite reverse' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-cyan-500/[0.03] blur-[100px] rounded-full"
          style={{ transform: 'translateZ(0px)', animation: 'float 10s ease-in-out infinite' }}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              role={msg.role} 
              content={msg.content} 
              data={msg.data} 
              isError={msg.isError} 
            />
          ))}
          
          {isLoading && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="h-4 bg-white/5 rounded-full w-1/4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded-full w-full animate-pulse"></div>
                  <div className="h-3 bg-white/5 rounded-full w-5/6 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="shrink-0 p-6 pt-2 bg-gradient-to-t from-[#09090B] via-[#09090B]/95 to-transparent z-10 relative">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 focus-within:bg-white/[0.05] transition-all shadow-2xl shadow-black/20"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any research topic..."
              className="w-full bg-transparent border-none outline-none px-4 py-3 text-zinc-100 placeholder:text-zinc-500"
              disabled={isLoading}
            />
            
            {/* Buttons Container - Right Aligned */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* New Chat Button */}
              <button 
                type="button"
                onClick={handleNewChat}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-all"
                title="Start New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="relative group"
              >
                <div className="absolute inset-0 bg-indigo-700 rounded-xl translate-y-1 group-disabled:translate-y-0.5 transition-transform duration-150" />
                <div className="relative bg-indigo-500 group-hover:bg-indigo-400 group-active:translate-y-1 group-disabled:bg-white/5 group-disabled:text-zinc-600 text-white p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
              </button>
            </div>
          </form>
          <p className="text-center mt-3 text-xs text-zinc-600">
            ResearchIQ generates AI insights. Always verify academic claims.
          </p>
        </div>
      </footer>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateZ(-50px); }
          50% { transform: translateY(-30px) translateZ(-50px); }
        }
      `}</style>
    </div>
  );
};