import React, { useState, useEffect } from 'react';
import { User, Sparkles, ExternalLink, Copy, CheckCheck, Bookmark, BookmarkCheck, Search, AlertTriangle, MessageSquare, Download } from 'lucide-react';
import type { ChatResponse, Paper } from '../services/api';
import { useLibrary } from '../context/LibraryContext';
import posthog from 'posthog-js';
import { ProjectRoadmap } from './ProjectRoadmap';
import { DeepDiveChat } from './DeepDiveChat';
import { exportToPDF } from '../utils/exportPDF';
import { Tilt3D } from './Tilt3D';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  data?: ChatResponse;
  isError?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, data, isError }) => {
  const isUser = role === 'user';
  const { toggleBookmark, isBookmarked } = useLibrary();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deepDivePaper, setDeepDivePaper] = useState<Paper | null>(null);

  // Debug logging
  useEffect(() => {
    if (data && role === 'assistant') {
      console.log('📊 Full Response Data:', data);
      console.log('📊 Ideas Data:', data.ideas);
      console.log('📊 Mini Projects Count:', data.ideas?.mini_projects?.length || 0);
      console.log('📊 Has Major Project:', !!data.ideas?.major_project?.title);
    }
  }, [data, role]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border ${
          isError ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'
        }`}>
          {isError ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
        </div>
      )}

      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex justify-end' : ''}`}>
        {isUser ? (
          <div className="bg-white/5 border border-white/10 text-zinc-200 px-5 py-3 rounded-2xl rounded-tr-sm">
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {isError ? (
              <div className="bg-amber-500/5 border border-amber-500/20 text-amber-200/90 px-5 py-4 rounded-xl">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-400 font-medium">{content}</p>

                {data && (
                  <>
                    {/* Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-full text-xs text-zinc-400">
                        <Search className="w-3 h-3 text-indigo-400" />
                        Searched: <span className="text-zinc-200 font-medium">"{data.refined_query}"</span>
                      </div>
                      
                      {data.papers?.length > 0 && (
                        <button 
                          onClick={() => exportToPDF(data, data.original_query)}
                          className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 hover:scale-105"
                        >
                          <Download className="w-3.5 h-3.5" /> Export PDF
                        </button>
                      )}
                    </div>

                    {/* Papers Grid - Only show papers with valid summaries */}
                    {data.papers?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">Analyzed Papers</h3>
                        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                          {data.papers
                            .filter(paper => paper.summary?.simple_explanation && paper.summary.simple_explanation !== "Error generating summary.")
                            .map((paper: Paper, idx: number) => {
                              const saved = isBookmarked(paper.url);
                              return (
                                <Tilt3D key={idx} maxTilt={10} scale={1.03} glare={true}>
                                  <div className="group relative bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 rounded-xl p-5 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)]">
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                      <h4 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">{paper.title}</h4>
                                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => { toggleBookmark(paper); posthog.capture('paper_bookmarked', { paper_title: paper.title }); }} 
                                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                                        >
                                          {saved ? <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" /> : <Bookmark className="w-3.5 h-3.5 text-zinc-400" />}
                                        </button>
                                        <button onClick={() => setDeepDivePaper(paper)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-indigo-400">
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                        <a href={paper.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                        </a>
                                      </div>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{paper.summary?.simple_explanation}</p>
                                    <div className="space-y-2">
                                      <div className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Problem</span>
                                        <span className="text-xs text-zinc-300">{paper.summary?.problem_statement}</span>
                                      </div>
                                      <div className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Method</span>
                                        <span className="text-xs text-zinc-300">{paper.summary?.methodology}</span>
                                      </div>
                                      <div className="bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Result</span>
                                        <span className="text-xs text-zinc-300">{paper.summary?.key_results}</span>
                                      </div>
                                    </div>
                                  </div>
                                </Tilt3D>
                              );
                            })}
                        </div>
                        {/* Show warning if all papers failed */}
                        {data.papers.filter(p => p.summary?.simple_explanation && p.summary.simple_explanation !== "Error generating summary.").length === 0 && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                            <p className="text-sm text-amber-200/80">⚠️ Unable to generate summaries for these papers. The AI service may be experiencing high demand.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Gap Analysis */}
                    {data.gap_analysis?.research_gaps?.length > 0 && (
                      <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-6 space-y-6">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Research Gaps</h3>
                        <ul className="space-y-2">
                          {data.gap_analysis.research_gaps.map((gap, i) => (
                            <li key={i} className="flex gap-2 text-sm text-zinc-300 items-start">
                              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-2 shrink-0" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Roadmap Section - Handle Empty Ideas Gracefully */}
                    {data.ideas && (data.ideas.mini_projects?.length > 0 || data.ideas.major_project?.title) ? (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">Your Project Roadmap</h3>
                        <ProjectRoadmap ideas={data.ideas} />
                      </div>
                    ) : (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-amber-200/80">
                          Unable to generate project ideas at this time.
                        </p>
                        <p className="text-xs text-amber-200/60 mt-1">
                          The AI service may be experiencing high demand. Please try again in a moment.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
      )}

      {deepDivePaper && <DeepDiveChat paper={deepDivePaper} onClose={() => setDeepDivePaper(null)} />}
    </div>
  );
};