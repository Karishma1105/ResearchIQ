import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { LibraryProvider } from './context/LibraryContext';
import { BookOpen, Sparkles } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');

  return (
    <LibraryProvider>
      <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans antialiased flex flex-col">
        {/* Premium Minimal Top Nav */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090B]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-lg font-semibold tracking-tight">ResearchIQ</span>
            </div>
            
            {/* Tab Switcher */}
            <nav className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'chat' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Research
              </button>
              <button 
                onClick={() => setActiveTab('library')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'library' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Library
              </button>
            </nav>

            <div className="w-24" /> {/* Spacer for perfect centering */}
          </div>
        </header>

        {/* Main Content Area - FIXED TO PREVENT CHAT DISAPPEARING */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* We use 'hidden' instead of unmounting to preserve chat state */}
          <div className={`flex-1 flex flex-col ${activeTab === 'chat' ? '' : 'hidden'}`}>
            <ChatInterface />
          </div>
          <div className={`flex-1 flex flex-col ${activeTab === 'library' ? '' : 'hidden'}`}>
            <Dashboard />
          </div>
        </main>
      </div>
    </LibraryProvider>
  );
}

export default App;