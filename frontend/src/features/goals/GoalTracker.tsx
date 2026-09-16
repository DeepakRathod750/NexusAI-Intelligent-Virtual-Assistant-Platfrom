import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Loader2, Trash2, CheckCircle2, Sparkles, Activity, SplitSquareVertical, Zap } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getGoals, createGoal, deleteGoal, updateGoal, Goal as IGoal } from '../../services/goalService';

type GoalCategory = 'Work' | 'Personal' | 'Health' | 'Learning' | 'Other';


const GoalTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | GoalCategory>('All');
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [goalAdvice, setGoalAdvice] = useState<Record<string, string>>({});
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const [isGeneratingMasterStrategy, setIsGeneratingMasterStrategy] = useState(false);
  const [masterStrategy, setMasterStrategy] = useState<string | null>(null);

  React.useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrementProgress = async (goal: IGoal, amount: number) => {
    const newProgress = Math.max(0, Math.min(100, goal.progress + amount));
    const newStatus = newProgress === 100 ? 'completed' : 'active';
    
    // 🚀 Optimistic UI Update
    setGoals(prev => prev.map(g => 
      g._id === goal._id ? { ...g, progress: newProgress, status: newStatus as any } : g
    ));

    try {
      await updateGoal(goal._id, {
        progress: newProgress,
        status: newStatus as any
      });
      // Silent fetch in background to sync any AI milestones generated
      const data = await getGoals();
      setGoals(data);
    } catch (error: any) {
      console.error('Update progress failed:', error);
      // Rollback on failure
      fetchGoals();
      const msg = error.message || 'Failed to update progress.';
      alert(`${msg}\n\nCheck if the backend and Ollama (llama3) are running.`);
    }
  };

  const handleNeuralReview = async (goal: IGoal) => {
    setIsReviewing(goal._id);
    try {
        const { decomposeTask } = await import('../../services/aiService');
        const strategy = await decomposeTask(`Goal: ${goal.title}. Category: ${goal.category}. Give me a 3-step strategy to achieve this.`);
        
        const adviceStr = Array.isArray(strategy) 
            ? strategy.map((s: any) => `• ${s.title}`).join('\n')
            : "Focus on immediate execution of the first priority.";
            
        setGoalAdvice(prev => ({ ...prev, [goal._id]: adviceStr }));
    } catch (error) {
        console.error('Neural Review failed:', error);
        alert('Neural Review is currently unavailable.');
    } finally {
        setIsReviewing(null);
    }
  };

  const handleMotivationSpike = async (goal: IGoal) => {
    setIsReviewing(goal._id);
    try {
        setGoalAdvice(prev => ({ ...prev, [goal._id]: "⚡ Generating high-intensity neural motivation..." }));
        const { decomposeTask } = await import('../../services/aiService');
        const motivation = await decomposeTask(`My goal is "${goal.title}" and it's currently at ${goal.progress}%. Give me a brutally aggressive 2-sentence motivational push to stop procrastinating and get it done right now. No fluff. Return ONLY a single string.`);
        setGoalAdvice(prev => ({ ...prev, [goal._id]: typeof motivation === 'string' ? motivation : motivation[0]?.title || "Get to work." }));
    } catch (error) {
        alert("Motivation spike failed.");
    } finally {
        setIsReviewing(null);
    }
  };

  const handleGenerateMasterStrategy = async () => {
      setIsGeneratingMasterStrategy(true);
      try {
          const goalTitles = goals.filter(g => g.status === 'active').map(g => g.title).join(", ");
          if (!goalTitles) {
              alert("You have no active goals to base a strategy on.");
              return;
          }
          const { decomposeTask } = await import('../../services/aiService');
          const strategy = await decomposeTask(`I have these active goals: [${goalTitles}]. Give me a single overarching executive summary strategy to prioritize and conquer all of them this week. Keep it very punchy and aggressive. Return ONLY a single string.`);
          setMasterStrategy(typeof strategy === 'string' ? strategy : JSON.stringify(strategy));
      } catch(e) {
          alert("Failed to generate master strategy");
      } finally {
          setIsGeneratingMasterStrategy(false);
      }
  };

  const handleDecomposeGoal = async (goal: IGoal) => {
      setIsReviewing(goal._id);
      try {
          const { decomposeTask } = await import('../../services/aiService');
          const strategy = await decomposeTask(`Goal: ${goal.title}. Provide exactly two immediate actionable sub-tasks to get started. Return ONLY JSON array of strings.`);
          
          let tasks = [];
          if (Array.isArray(strategy)) {
              tasks = strategy.map((s: any) => s.title || s);
          } else {
              tasks = ["Analyze requirements", "Create initial draft"]; // Fallback
          }

          let created = 0;
          for (const task of tasks) {
              if (typeof task === 'string') {
                  await createGoal({
                      title: `[Sub-task] ${task.slice(0, 50)}`,
                      category: goal.category,
                      status: 'active',
                      progress: 0
                  });
                  created++;
              }
          }
          alert(`AI Task Decomposer generated and tracked ${created} new micro-tasks from "${goal.title}"!`);
          fetchGoals();
      } catch (error) {
          console.error("Failed to decompose", error);
          alert("Decomposition failed.");
      } finally {
          setIsReviewing(null);
      }
  };

  const isPredictiveAtRisk = (g: IGoal) => {
      if (g.status === 'completed') return false;
      try {
          const timestamp = parseInt(g._id.substring(0,8), 16) * 1000;
          const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
          // Flag if older than 1 hour and progress < 20% (demonstration tuning)
          return ageHours > 1 && g.progress < 20;
      } catch (e) {
          return false;
      }
  };

  const visibleGoals = useMemo(() => {
    if (activeTab === 'All') return goals;
    return goals.filter((g) => g.category === activeTab);
  }, [activeTab, goals]);

  const handleNewGoal = async () => {
    if (!newGoalTitle.trim()) {
      setIsAddingGoal(true);
      return;
    }

    try {
      const category = activeTab === 'All' ? 'Work' : activeTab;
      await createGoal({
        title: newGoalTitle.trim(),
        category,
        status: 'active',
        progress: 0
      });
      setNewGoalTitle('');
      setIsAddingGoal(false);
      fetchGoals();
    } catch (error) {
      alert('Failed to create goal');
    }
  };

  const handleToggleComplete = async (goal: IGoal) => {
    try {
      await updateGoal(goal._id, {
        status: goal.status === 'completed' ? 'active' : 'completed',
        progress: goal.status === 'completed' ? 0 : 100
      });
      fetchGoals();
    } catch (error) {
      alert('Failed to update goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await deleteGoal(id);
      fetchGoals();
    } catch (error) {
      alert('Failed to delete goal');
    }
  };

  const tabs: Array<{ key: 'All' | GoalCategory; label: string }> = [
    { key: 'All', label: 'All Goals' },
    { key: 'Work', label: 'Work' },
    { key: 'Personal', label: 'Personal' },
    { key: 'Health', label: 'Health' },
    { key: 'Learning', label: 'Learning' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Target size={18} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Goal & OKR Tracker</h1>
              <p className="text-sm text-gray-400 mt-1">Set objectives - Track results - AI Coaching</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
            <button 
               onClick={handleGenerateMasterStrategy}
               disabled={isGeneratingMasterStrategy}
               className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]"
            >
               {isGeneratingMasterStrategy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-purple-400" />}
               {isGeneratingMasterStrategy ? 'Synthesizing...' : 'Master Strategy'}
            </button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddingGoal(true)}
            >
              New Goal
            </Button>
        </div>
      </header>

      {masterStrategy && (
          <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 relative"
          >
             <button onClick={() => setMasterStrategy(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl font-light">✕</button>
             <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={14} /> AI Executive Master Strategy</h3>
             <p className="text-gray-200 leading-relaxed text-sm font-light italic">"{masterStrategy}"</p>
          </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? 'bg-primary/10 text-white border-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-white/5'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {isAddingGoal && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-surface/50 border border-primary/20 flex gap-3 shadow-lg"
        >
          <input
            autoFocus
            placeholder="What is your objective?"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNewGoal()}
            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-500"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setIsAddingGoal(false); setNewGoalTitle(''); }}>Cancel</Button>
            <Button size="sm" onClick={handleNewGoal}>Create</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : visibleGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] text-center opacity-70 select-none">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
            <Target size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No goals yet.</h2>
          <p className="text-sm text-gray-400 max-w-md">
            Click <span className="text-white font-medium">New Goal</span> to set your first objective.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGoals.map((g) => (
            <Card key={g._id} className="p-5 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-lg font-semibold transition-all ${g.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {g.title}
                    </h3>
                    <Badge variant="outline">{g.category}</Badge>
                    <Badge variant={g.status === 'completed' ? 'success' : 'default'}>
                      {g.status === 'completed' ? 'Done' : 'Active'}
                    </Badge>
                    {isPredictiveAtRisk(g) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] uppercase font-bold tracking-widest animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                            <Activity size={10} /> Predictive Risk
                        </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                       <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-500 uppercase tracking-tighter text-[10px]">Progress</span>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleIncrementProgress(g, -5)} 
                               disabled={g.progress === 0}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-400 transition-all active:scale-90 disabled:opacity-20 translate-y-[1px]"
                               title="Decrease 5%"
                             >
                               <span className="text-lg font-light leading-none">−</span>
                             </button>
                             <button 
                               onClick={() => handleIncrementProgress(g, 5)} 
                               disabled={g.progress === 100}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/30 text-primary transition-all active:scale-90 disabled:opacity-20 translate-y-[1px] shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)]"
                               title="Increase 5%"
                             >
                               <span className="text-lg font-light leading-none">+</span>
                             </button>
                          </div>
                       </div>
                       <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-bold leading-none transition-colors ${g.progress === 100 ? 'text-emerald-400' : 'text-white'}`}>{g.progress}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">%</span>
                       </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-700 rounded-full relative ${g.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}
                        style={{ width: `${Math.max(0, Math.min(100, g.progress))}%` }}
                      >
                         {g.progress === 100 && (
                            <motion.div 
                               initial={{ x: '-100%' }}
                               animate={{ x: '200%' }}
                               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"
                            />
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Neural Advice / Progress Motivation */}
                  {(() => {
                    const milestones = g.neural_milestones || {};
                    const milestoneKeys = Object.keys(milestones).map(Number).filter(n => n <= g.progress).sort((a, b) => b - a);
                    const latestMilestone = milestoneKeys.length > 0 ? milestones[milestoneKeys[0].toString()] : null;
                    const isGenerating = g.progress > 0 && !milestones[g.progress.toString()] && (!latestMilestone || (Date.now() - new Date(latestMilestone.generatedAt).getTime() < 60000));

                    if (!goalAdvice[g._id] && !latestMilestone && !isGenerating) return null;

                    return (
                      <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 space-y-3"
                      >
                          {isGenerating && !milestones[g.progress.toString()] && (
                             <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 border-dashed text-[10px] flex items-center gap-3 text-primary/60 animate-pulse">
                                <Loader2 size={12} className="animate-spin" />
                                <span className="font-bold uppercase tracking-widest">Neural Intelligence calculating stage strategy...</span>
                             </div>
                          )}

                          {latestMilestone && (
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] leading-relaxed relative overflow-hidden group/milestone">
                              <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold uppercase tracking-widest text-[9px]">
                                  <Sparkles size={10} /> {milestoneKeys[0] === 100 ? 'Achievement Unlocked' : `Neural Strategy (${milestoneKeys[0]}%)`}
                              </div>
                              <p className="text-gray-300">
                                  <span className="text-emerald-400 font-semibold mr-1">Tip:</span> 
                                  {latestMilestone.tip}
                              </p>
                              <p className="text-gray-300 mt-1 italic opacity-80">
                                  <span className="text-purple-400 font-semibold mr-1 not-italic">Motivation:</span> 
                                  "{latestMilestone.motivation}"
                              </p>
                              <div className="absolute -right-2 -bottom-2 opacity-5 text-emerald-400 group-hover/milestone:scale-110 transition-transform">
                                <Target size={40} />
                              </div>
                            </div>
                          )}

                          {goalAdvice[g._id] && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                                <div className="flex items-center gap-2 mb-2 text-primary font-bold uppercase tracking-widest text-[9px]">
                                    <Target size={10} /> AI Strategy
                                </div>
                                {goalAdvice[g._id]}
                            </div>
                          )}
                      </motion.div>
                    );
                  })()}

                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                     onClick={() => handleMotivationSpike(g)}
                     disabled={isReviewing === g._id}
                     className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-500 transition-colors"
                     title="Motivation Spike"
                  >
                    <Zap size={18} />
                  </button>
                  <button 
                     onClick={() => handleDecomposeGoal(g)}
                     disabled={isReviewing === g._id}
                     className="p-2 rounded-lg hover:bg-violet-500/20 text-violet-400 transition-colors"
                     title="AI Task Decomposer"
                  >
                    <SplitSquareVertical size={18} />
                  </button>
                  <button 
                     onClick={() => handleNeuralReview(g)}
                     disabled={isReviewing === g._id}
                     className={`p-2 rounded-lg hover:bg-primary/20 text-primary ${isReviewing === g._id ? 'animate-pulse' : ''}`}
                     title="Neural Review"
                  >
                    <Sparkles size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleComplete(g)}
                    className={`p-2 rounded-lg hover:bg-white/10 ${g.status === 'completed' ? 'text-emerald-400' : 'text-gray-400'}`}
                    title={g.status === 'completed' ? 'Mark as Active' : 'Mark as Done'}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(g._id)}
                    className="p-2 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400"
                    title="Delete Goal"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
