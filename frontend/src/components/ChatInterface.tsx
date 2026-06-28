import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowDown, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { sendChatQuery } from '../services/api';
import type { ChatResponse } from '../services/api';
import { useLibrary } from '../context/LibraryContext';
import posthog from 'posthog-js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: ChatResponse;
  isError?: boolean;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Welcome to ResearchIQ! I'm your AI research assistant. Enter a project idea or research topic, and I'll find relevant papers, analyze research gaps, and suggest project roadmaps.",
};

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { saveToHistory } = useLibrary();

  // Scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Detect scroll position to show/hide button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show button if user is more than 200px from bottom
      setShowScrollButton(distanceFromBottom > 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatQuery(query);
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I found ${data.papers.length} relevant papers and analyzed the research landscape.`,
        data,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      saveToHistory(query, data);
      posthog.capture('chat_query_success', { query_length: query.length });
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error.message || "I'm having trouble connecting to the research database. Please try again.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      posthog.capture('chat_query_error', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Clean, seamless main container (No heavy borders or box shadows)
    <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto w-full">
      
      {/* Messages Area (Scrollable, scrollbar hidden) */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} data={msg.data} isError={msg.isError} />
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Analyzing research papers...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll to Bottom Button (Clean, floating) */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 right-6 z-20 flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-900/50 transition-all duration-300 hover:scale-110 animate-in fade-in zoom-in"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area (No hard top border line) */}
      <div className="p-4 pt-2">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a research topic or project idea..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="relative group flex items-center justify-center w-11 h-11 bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};