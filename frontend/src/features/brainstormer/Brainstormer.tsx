import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Zap, Sparkles, Copy, RefreshCw, History as HistoryIcon, Plus, CheckCircle2 } from 'lucide-react';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { useSession } from '../../hooks/useSession';
import { SessionSidebar } from '../../components/shared/SessionSidebar';

const Brainstormer: React.FC = () => {
    const {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        saveSession,
        createNewSession,
        setIsProcessing
    } = useSession('brainstorm', { topic: '', ideas: [] });

    const navigate = useNavigate();

    const [isReverseEngineered, setIsReverseEngineered] = useState(false);
    const [isSwotMode, setIsSwotMode] = useState(false);

    // Sync local state
    const topic = sessionContent.topic || '';
    const ideas = sessionContent.ideas || [];

    const setTopic = (val: string) => setSessionContent({ ...sessionContent, topic: val });
    const setIdeas = (val: string[]) => setSessionContent({ ...sessionContent, ideas: val });


    const handleBrainstorm = async () => {
        if (!topic.trim() || isProcessing) return;
        setIsProcessing(true);
        try {
            let advancedTopic = topic.trim();
            if (isReverseEngineered) {
                advancedTopic += ". VERY IMPORTANT: Output a completely Reverse-Engineered Logic tree showing how to achieve this step-by-step from the end goal backwards to the present.";
            }
            if (isSwotMode) {
                advancedTopic += ". VERY IMPORTANT: Also generate a full SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) for this idea.";
            }

            const response = await api.post<any>('/api/ai/brainstorm', {
                topic: advancedTopic
            });
            
            const resultData = response.data || response; 
            if (resultData.ideas && resultData.ideas.length > 0) {
                const newIdeas = resultData.ideas;
                setIdeas(newIdeas);
                await saveSession({ topic, ideas: newIdeas }, `Spark: ${topic.slice(0, 30)}...`);
            } else {
                throw new Error("No ideas returned from AI.");
            }
        } catch (error) {
            console.error(error);
            alert('Brainstorming failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-screen flex flex-col overflow-hidden">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Lightbulb size={16} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500">Creative Suite</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight uppercase">Creative Spark</h1>
          <p className="text-gray-400">Generate innovative ideas powered by Nexus AI lateral thinking.</p>
        </div>
        <Button 
            variant="ghost" 
            onClick={createNewSession}
            className="text-xs gap-2 border border-white/10"
        >
            <Plus size={14} /> New Spark
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Recent Sparks Sidebar */}
        <div className="lg:col-span-3 hidden lg:block overflow-hidden flex flex-col">
            <SessionSidebar 
                title="Recent Sparks"
                sessions={recentSessions}
                activeSessionId={activeSessionId}
                onSessionSelect={(id) => navigate(`?session=${id}`)}
                onNewSession={createNewSession}
            />
        </div>

        {/* Main Interface */}
        <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          <Card className="p-2 flex items-center gap-2 bg-[#0f1115]/80 border-white/10 p-2 pl-4 shrink-0">
            <Zap className="text-amber-500" size={20} />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBrainstorm()}
              placeholder="What do you need ideas for? (e.g., 'Marketing slogans for a coffee brand')"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 h-10 text-sm"
              disabled={isProcessing}
            />
            <Button
              onClick={handleBrainstorm}
              isLoading={isProcessing}
              disabled={!topic.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
            >
              Spark <Sparkles className="ml-2 w-4 h-4" />
            </Button>
            </Card>

            <div className="flex gap-4">
                <div 
                    onClick={() => setIsReverseEngineered(!isReverseEngineered)}
                    className={`flex-1 p-3 rounded-xl border cursor-pointer border-white/10 transition-all flex items-center justify-between ${isReverseEngineered ? 'bg-amber-500/10 border-amber-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Reverse-Eng Logic Tree</span>
                        <span className="text-[9px] text-gray-500">Plan backwards from the goal</span>
                    </div>
                    {isReverseEngineered && <CheckCircle2 size={14} className="text-amber-500" />}
                </div>

                <div 
                    onClick={() => setIsSwotMode(!isSwotMode)}
                    className={`flex-1 p-3 rounded-xl border cursor-pointer border-white/10 transition-all flex items-center justify-between ${isSwotMode ? 'bg-amber-500/10 border-amber-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Auto SWOT Matrix</span>
                        <span className="text-[9px] text-gray-500">Strengths, Weaknesses, Opps, Threats</span>
                    </div>
                    {isSwotMode && <CheckCircle2 size={14} className="text-amber-500" />}
                </div>
            </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {isProcessing && ideas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                     <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                     <p className="text-amber-500 animate-pulse text-sm font-bold uppercase tracking-widest">Neural Ideation...</p>
                </div>
            ) : ideas.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-8">
                {ideas.map((idea, index) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-amber-500/30 transition-all duration-300"
                  >
                    <div className="flex gap-4">
                      <span className="text-amber-500/30 font-mono text-xs mt-1 font-bold">{(index + 1).toString().padStart(2, '0')}</span>
                      <p className="text-gray-200 leading-relaxed text-sm">{idea.replace(/^[\d\-\.\*]+\s*/, '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 rotate-12">
                  <Lightbulb size={40} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Ready to Spark?</h3>
                <p className="text-sm text-gray-400 max-w-xs">Enter a topic above to generate a list of creative ideas and strategies.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-md">
                    {[
                        "Startup ideas for 2026",
                        "Creative blog titles",
                        "Marketing slogans",
                        "Product name ideas"
                    ].map(t => (
                        <div key={t} onClick={() => setTopic(t)} className="p-3 text-[10px] rounded-xl border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all uppercase tracking-widest font-bold">
                            {t}
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brainstormer;

