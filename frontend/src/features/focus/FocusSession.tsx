import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap,
  CheckCircle2,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getGoals, updateGoal, Goal as IGoal } from '../../services/goalService';

const FocusSession: React.FC = () => {
  const [timerMode, setTimerMode] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [taskComplexity, setTaskComplexity] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    getGoals().then(res => setGoals(res.filter(g => g.status === 'active'))).catch(console.error);
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setSessionsCompleted((prev) => prev + 1);
      if (timerRef.current) clearInterval(timerRef.current);
      
      let msg = 'Focus session complete! Take a physical break.';
      if (selectedGoalId) {
          const g = goals.find(x => x._id === selectedGoalId);
          if (g) {
              msg = `Neural Focus Linked Goal Updated!\n\nAdded +5% progress to: "${g.title}"`;
              updateGoal(selectedGoalId, { progress: Math.min(100, g.progress + 5) }).catch(console.error);
          }
      }
      alert(msg);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(timerMode * 60);
  };
  const switchMode = (mode: number) => {
    setTimerMode(mode);
    setIsActive(false);
    setTimeLeft(mode * 60);
  };

  const handleComplexityChange = (c: 'Low' | 'Medium' | 'High') => {
      setTaskComplexity(c);
      let mins = 25;
      if (c === 'Low') mins = 15;
      if (c === 'High') mins = 45;
      switchMode(mins);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 min-h-screen">
      <header>
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <Clock size={16} className="text-primary" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Performance Layer</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-2">Focus Session</h1>
        <p className="text-gray-400">Deep work protocol powered by Pomodoro technique.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timer Card */}
        <Card className="p-10 bg-linear-to-br from-primary/10 via-transparent to-transparent border-primary/20 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 p-6">
                <Zap size={24} className="text-primary/20 animate-pulse" />
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 120}
                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - timeLeft / (timerMode * 60)) }}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">Active Focus</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs mb-8">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Neuro-Adaptive Cognitive Load</label>
                <div className="flex gap-2">
                    <button 
                    onClick={() => handleComplexityChange('Low')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${taskComplexity === 'Low' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                    >Low</button>
                    <button 
                    onClick={() => handleComplexityChange('Medium')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${taskComplexity === 'Medium' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                    >Med</button>
                    <button 
                    onClick={() => handleComplexityChange('High')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${taskComplexity === 'High' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                    >High</button>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs mb-8">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Link to Goal (Auto-add +5%)</label>
                <select 
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary/50 transition-all font-light"
                >
                    <option value="" className="bg-black text-gray-500">Do not track directly</option>
                    <option value="demo-1" className="bg-black text-gray-300">Option 1: Complete Project Pitch</option>
                    <option value="demo-2" className="bg-black text-gray-300">Option 2: Deep System Coding</option>
                    <option value="demo-3" className="bg-black text-gray-300">Option 3: Write Documentation</option>
                    <option value="demo-4" className="bg-black text-gray-300">Option 4: Reply to Backlog Emails</option>
                    {goals.map(g => (
                        <option key={g._id} value={g._id} className="bg-black text-white">{g.title}</option>
                    ))}
                </select>
            </div>

            <div className="flex gap-4 w-full max-w-xs">
                <Button 
                  onClick={toggleTimer}
                  className="flex-1 rounded-2xl h-14 bg-white text-black hover:bg-white/90 font-bold flex items-center justify-center gap-3 text-sm"
                >
                  {isActive ? <Pause size={20} /> : <Play size={20} />}
                  {isActive ? 'Pause Flow' : 'Start Session'}
                </Button>
                <button 
                  onClick={resetTimer}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all"
                >
                  <RotateCcw size={20} />
                </button>
            </div>
        </Card>

        {/* Stats & Guide */}
        <div className="space-y-6">
            <Card className="p-6 border-white/5 bg-surface/30">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    Session Analytics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Completed</p>
                        <p className="text-2xl font-bold text-white">{sessionsCompleted}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Time</p>
                        <p className="text-2xl font-bold text-emerald-400">{sessionsCompleted * timerMode}m</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-white/5 bg-surface/30">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Deep Work Guidelines</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">Eliminate all digital distractions (notifications, social media, extra tabs).</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">Focus on exactly ONE high-leverage task for the duration of the timer.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">When the timer ends, take a 5-minute physical break away from the screen.</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 mb-3">
                    <Brain size={18} className="text-primary" />
                    <h4 className="text-sm font-bold text-white">Neural Optimization</h4>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                    Your focus sessions are tracked to optimize AI suggestions in the Command Center. High-intensity focus unlocks advanced productivity insights.
                </p>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default FocusSession;
