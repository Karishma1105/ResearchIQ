import React, { useState } from 'react';
import { ChevronDown, Rocket, Zap, Code, Trophy } from 'lucide-react';
import { Tilt3D } from './Tilt3D';

interface ProjectIdeas {
  mini_projects: Array<{ title: string; description: string; tech_stack: string[] }>;
  major_project: { title: string; description: string; tech_stack: string[] };
}

interface ProjectRoadmapProps {
  ideas: ProjectIdeas;
}

export const ProjectRoadmap: React.FC<ProjectRoadmapProps> = ({ ideas }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const roadmapSteps = [
    ...ideas.mini_projects.map((p, i) => ({ ...p, type: 'mini', icon: i === 0 ? <Zap className="w-4 h-4" /> : i === 1 ? <Code className="w-4 h-4" /> : <Rocket className="w-4 h-4" /> })),
    { ...ideas.major_project, type: 'major', icon: <Trophy className="w-4 h-4" /> }
  ];

  const toggleStep = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="relative pl-8" style={{ perspective: '1000px' }}>
      {/* 3D Vertical Connecting Line */}
      <div 
        className="absolute left-3 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent rounded-full"
        style={{
          transform: 'translateZ(20px)',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
        }}
      />

      <div className="space-y-4">
        {roadmapSteps.map((step, index) => {
          const isExpanded = expandedIndex === index;
          const isMajor = step.type === 'major';

          return (
            <div 
              key={index} 
              className="relative animate-in fade-in slide-in-from-left-4 duration-500"
              style={{ 
                animationDelay: `${index * 100}ms`,
                transform: `translateZ(${isExpanded ? '30px' : '0px'})`,
                transition: 'transform 300ms ease-out'
              }}
            >
              {/* 3D Timeline Dot */}
              <div 
                className={`absolute -left-5 top-5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isExpanded 
                    ? 'bg-indigo-500 border-indigo-400 scale-125' 
                    : 'bg-[#09090B] border-zinc-700'
                }`}
                style={{
                  transform: `translateZ(${isExpanded ? '40px' : '10px'})`,
                  boxShadow: isExpanded ? '0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                <span className={`transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-zinc-500'}`}>
                  {step.icon}
                </span>
              </div>

              {/* 3D Tilt Card */}
              <Tilt3D maxTilt={5} scale={1.01} glare={isExpanded}>
                <div 
                  onClick={() => toggleStep(index)}
                  className={`cursor-pointer rounded-xl border transition-all duration-500 ease-in-out overflow-hidden ${
                    isExpanded 
                      ? isMajor ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_20px_40px_rgba(99,102,241,0.2)]' : 'bg-white/[0.04] border-white/20 shadow-[0_15px_30px_rgba(255,255,255,0.1)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        isMajor ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {isMajor ? 'Final Goal' : `Step ${index + 1}`}
                      </span>
                      <h4 className={`font-semibold transition-colors ${isExpanded ? 'text-white' : 'text-zinc-300'}`}>
                        {step.title}
                      </h4>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} />
                  </div>

                  <div className={`transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-4 pb-4 pt-1 border-t border-white/5">
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4 mt-3">{step.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.tech_stack?.map((tech, i) => (
                          <span key={i} className="bg-black/30 border border-white/10 text-zinc-300 text-[10px] px-2 py-1 rounded-md font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </div>
          );
        })}
      </div>
    </div>
  );
};