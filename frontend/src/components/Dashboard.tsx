// src/components/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { Clock, Bookmark, Trash2, ExternalLink, Search, BarChart3, Sparkles } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

const EmptyState: React.FC<{ message: string; icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-600">
      {icon}
    </div>
    <p className="text-sm text-zinc-500 max-w-xs">{message}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { history, bookmarks, clearHistory, toggleBookmark, resetAppData } = useLibrary();
  const [activeView, setActiveView] = useState<'history' | 'bookmarks'>('history');
  const [searchFilter, setSearchFilter] = useState('');

  // Filter history based on search input
  const filteredHistory = useMemo(() => {
    if (!searchFilter) return history;
    return history.filter(item => 
      item.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.data?.refined_query?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [history, searchFilter]);

  const restoreSearch = (item: any) => {
    window.dispatchEvent(new CustomEvent('restoreSearch', { detail: item }));
    // Optional: Switch back to chat tab automatically
    // window.dispatchEvent(new CustomEvent('switchTab', { detail: 'chat' }));
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Premium Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Searches</p>
              <p className="text-2xl font-bold text-zinc-100">{history.length}</p>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Saved Papers</p>
              <p className="text-2xl font-bold text-zinc-100">{bookmarks.length}</p>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Last Active</p>
              <p className="text-sm font-semibold text-zinc-100 mt-1">
                {history.length > 0 ? new Date(history[0].timestamp).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">My Library</h1>
            <p className="text-sm text-zinc-500 mt-1">Your local research history and saved papers.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Filter */}
            {activeView === 'history' && history.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter history..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 w-48"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setActiveView('history')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  activeView === 'history' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> History
              </button>
              <button 
                onClick={() => setActiveView('bookmarks')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  activeView === 'bookmarks' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" /> Saved ({bookmarks.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {activeView === 'history' ? (
          <div className="space-y-4">
            {history.length > 0 && (
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { if(window.confirm("Wipe all app data?")) resetAppData(); }} 
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-md hover:bg-white/5"
                >
                  Reset App
                </button>
                <button onClick={clearHistory} className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3" /> Clear History
                </button>
              </div>
            )}
            
            {filteredHistory.length === 0 ? (
              <EmptyState 
                message={searchFilter ? "No searches match your filter." : "No research history yet. Start a search to see it here!"} 
                icon={<Clock className="w-6 h-6" />} 
              />
            ) : (
              <div className="grid gap-3">
                {filteredHistory.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => restoreSearch(item)}
                    className="bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 rounded-xl p-5 transition-all group cursor-pointer hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-zinc-100 mb-1 truncate">{item.query}</h3>
                        <p className="text-xs text-zinc-500">
                          {new Date(item.timestamp).toLocaleString()} • {item.data?.papers?.length || 0} papers analyzed
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md hidden md:block">
                          {item.data?.refined_query}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {bookmarks.length === 0 ? (
              <EmptyState 
                message="No bookmarked papers yet. Hover over a paper card in the chat and click the bookmark icon to save it here!" 
                icon={<Bookmark className="w-6 h-6" />} 
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((paper, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 rounded-xl p-5 transition-all group flex flex-col">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h4 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 flex-1">{paper.title}</h4>
                      <button onClick={() => toggleBookmark(paper)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors shrink-0">
                        <Bookmark className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-3 flex-1">{paper.summary?.simple_explanation}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{paper.source}</span>
                      <a href={paper.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium">
                        Read <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};