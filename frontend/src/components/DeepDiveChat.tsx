import React, { useState } from 'react';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import type { Paper } from '../services/api';

interface DeepDiveChatProps {
  paper: Paper;
  onClose: () => void;
}

export const DeepDiveChat: React.FC<DeepDiveChatProps> = ({ paper, onClose }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: `I'm ready to discuss "${paper.title}". What would you like to know?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paper: { title: paper.title, abstract: paper.abstract }, 
          question: userQuestion 
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      style={{ perspective: '1000px' }}
    >
      <div 
        className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        style={{
          animation: 'modalFlip 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="flex items-start justify-between p-5 border-b border-white/10 bg-white/[0.02] rounded-t-2xl">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-100 text-sm leading-snug line-clamp-2">
                {paper.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Deep Dive Chat</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[50vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-white/5 border border-white/10 text-zinc-200'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 border-t border-white/10 bg-white/[0.02] rounded-b-2xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about methodology, results, or anything else..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !question.trim()} 
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-zinc-600 text-white px-5 py-3 rounded-xl transition-all flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* 3D Flip Animation Keyframes */}
      <style>{`
        @keyframes modalFlip {
          0% { 
            opacity: 0;
            transform: rotateY(-90deg) scale(0.8);
          }
          100% { 
            opacity: 1;
            transform: rotateY(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};