import React from 'react';
import { User, Bot, ExternalLink, Lightbulb, AlertTriangle, Target, BookOpen, Search } from 'lucide-react';
import type { ChatResponse, Paper } from '../services/api';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  data?: ChatResponse;
  isLoading?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, data, isLoading }) => {
  const isUser = role === 'user';

  if (isLoading) {
    return (
      <div className="flex w-full mb-8 justify-start">
        <div className="flex gap-4 max-w-4xl">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0 border border-accent/30">
            <Bot className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div className="glass-panel rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-textSecondary text-sm font-medium">Researching and analyzing papers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-10 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-4 max-w-4xl w-full ${isUser ? 'flex-row-reverse' : ''}`}>
        
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
          isUser 
            ? 'bg-surfaceHover border-white/10' 
            : 'bg-accent/10 border-accent/30'
        }`}>
          {isUser ? <User className="w-5 h-5 text-textPrimary" /> : <Bot className="w-5 h-5 text-accent" />}
        </div>

        {/* Content */}
        <div className={`flex-1 flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-6 py-4 rounded-2xl max-w-full ${
            isUser 
              ? 'bg-accent text-white rounded-tr-sm shadow-lg shadow-accent/20' 
              : 'glass-panel rounded-tl-sm text-textPrimary'
          }`}>
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>

          {/* AI Structured Data */}
          {!isUser && data && (
            <div className="w-full flex flex-col gap-6 mt-4 animate-slide-up">
              
              {/* Search Info */}
              <div className="flex items-center gap-2 text-sm text-textSecondary bg-surface/50 p-3 rounded-lg border border-white/5">
                <Search className="w-4 h-4 text-accent" />
                <span>Searched for: <span className="text-accent/90 font-medium">"{data.refined_query}"</span></span>
              </div>

              {/* Papers Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-textPrimary">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Analyzed Papers
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.papers.map((paper: Paper, idx: number) => (
                    <div key={idx} className="bg-surfaceHover/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h4 className="font-medium text-blue-200 leading-snug line-clamp-2" title={paper.title}>
                          {paper.title}
                        </h4>
                        <a href={paper.url} target="_blank" rel="noreferrer" className="p-1 hover:bg-white/10 rounded-md transition-colors shrink-0 text-textSecondary hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-sm text-textPrimary mb-4">{paper.summary.simple_explanation}</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="bg-surface/80 p-2 rounded border border-white/5">
                          <span className="font-semibold text-textSecondary block mb-1">Problem:</span>
                          <span className="text-textPrimary/90">{paper.summary.problem_statement}</span>
                        </div>
                        <div className="bg-surface/80 p-2 rounded border border-white/5">
                          <span className="font-semibold text-textSecondary block mb-1">Method:</span>
                          <span className="text-textPrimary/90">{paper.summary.methodology}</span>
                        </div>
                        <div className="bg-surface/80 p-2 rounded border border-white/5">
                          <span className="font-semibold text-textSecondary block mb-1">Result:</span>
                          <span className="text-textPrimary/90">{paper.summary.key_results}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-[10px] uppercase tracking-wider text-textSecondary font-semibold">
                        Source: {paper.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="bg-gradient-to-br from-surfaceHover to-surface border border-white/10 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Research Gap Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-3">Common Approaches</h4>
                    <ul className="space-y-2">
                      {data.gap_analysis.common_approaches?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span className="text-textPrimary/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-3">Limitations</h4>
                    <ul className="space-y-2">
                      {data.gap_analysis.limitations?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span className="text-textPrimary/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:col-span-2 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mt-2">
                    <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Identified Gaps
                    </h4>
                    <ul className="space-y-2">
                      {data.gap_analysis.research_gaps?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                          <span className="text-textPrimary">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ideas */}
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-textPrimary">
                  <Lightbulb className="w-5 h-5 text-green-400" />
                  Project Ideas based on Gaps
                </h3>
                
                {/* Major Idea */}
                {data.ideas.major_project && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-bl-lg">MAJOR PROJECT</div>
                    <h4 className="text-xl font-bold text-green-300 mb-2 mt-2">{data.ideas.major_project.title}</h4>
                    <p className="text-textPrimary/90 mb-4 text-sm leading-relaxed">{data.ideas.major_project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {data.ideas.major_project.tech_stack?.map((tech, i) => (
                        <span key={i} className="bg-surface/80 border border-white/10 text-textSecondary text-xs px-2.5 py-1 rounded-md">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mini Ideas */}
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {data.ideas.mini_projects?.map((idea, idx) => (
                    <div key={idx} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                      <div className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">Mini Project {idx + 1}</div>
                      <h4 className="font-semibold text-textPrimary mb-2">{idea.title}</h4>
                      <p className="text-sm text-textSecondary mb-4 line-clamp-3">{idea.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {idea.tech_stack?.slice(0,3).map((tech, i) => (
                          <span key={i} className="bg-white/5 text-textSecondary text-[10px] px-2 py-0.5 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
