import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { sendChatQuery } from '../services/api';
import type { ChatResponse } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: ChatResponse;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am ResearchIQ, your AI-powered research assistant. Enter a project idea or topic, and I will find relevant papers, summarize them, analyze research gaps, and suggest project ideas for you.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userQuery }]);
    
    setIsLoading(true);

    try {
      const data = await sendChatQuery(userQuery);
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `Here is the comprehensive research analysis for "${userQuery}".`,
        data 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'I encountered an error while processing your request. Ensure the backend is running and API keys are configured.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-textPrimary relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="glass-panel sticky top-0 z-10 px-6 py-4 flex items-center gap-3 border-b border-white/5">
        <div className="bg-accent/20 p-2 rounded-lg border border-accent/30">
          <GraduationCap className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">ResearchIQ</h1>
          <p className="text-xs text-textSecondary font-medium">AI Academic Mentor</p>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto scrollbar-custom p-6 md:p-8">
        <div className="max-w-5xl mx-auto flex flex-col">
          {messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              role={msg.role} 
              content={msg.content} 
              data={msg.data} 
            />
          ))}
          {isLoading && <MessageBubble role="assistant" content="" isLoading={true} />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6 pt-2 bg-gradient-to-t from-background via-background to-transparent z-10">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="glass-panel rounded-2xl p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent/50 transition-all shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a project topic or idea (e.g., 'Blockchain in Healthcare')..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-textPrimary placeholder:text-textSecondary/70"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-accent hover:bg-accent/90 disabled:bg-surface disabled:text-textSecondary text-white p-3 rounded-xl transition-colors flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3 text-xs text-textSecondary/50 font-medium">
            ResearchIQ generates AI insights. Always verify academic claims.
          </div>
        </div>
      </footer>
    </div>
  );
};
