import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageSquare,
  FileText,
  Lightbulb,
  Type,
  ArrowRight,
  Sparkles,
  History,
  Activity,
  Clock,
  Mail,
  Zap
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getSessions, Session, HistoryItem, getDashboardStats, DashboardStats } from '../../services/dashboardService';
import { Plus, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionData, statsData] = await Promise.all([
          getSessions(20),
          getDashboardStats()
        ]);
        setSessions(sessionData);
        setStats(statsData);
        setStats(statsData);
      } catch (error) {
        console.error('Dashboard data fetch failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);




  const handleResumeSession = (session: Session) => {
    const routeMap: Record<string, string> = {
      chat: '/chat',
      email: '/email-assistant',
      meeting: '/meeting-notes',
      resume: '/resume-generator',
      doc: '/doc-analyzer',
      writing: '/writing-studio',
      brainstorm: '/brainstormer'
    };
    const baseRoute = routeMap[session.type] || '/writing-studio';
    navigate(`${baseRoute}?session=${session._id}`);
  };

  const lastActivity = sessions[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Neural Workspace Active</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold text-white tracking-tight mb-2"
          >
            Command Center
          </motion.h1>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Local Llama-3 Active</span>
            </div>
          </div>
        </div>

        {/* AI Insight & New Session */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            onClick={() => navigate('/chat')}
            className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 h-14 px-8 rounded-2xl"
          >
            <Plus size={18} /> New Session
          </Button>

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (Left/Middle) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Global Analytics Section */}
          {stats && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-primary/50" size={16} />
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Neural Impact Analytics</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Chats', value: stats.chats, color: 'text-primary', icon: <MessageSquare size={12} /> },
                  { label: 'Documents', value: stats.docs, color: 'text-blue-400', icon: <FileText size={12} /> },
                  { label: 'Emails', value: stats.emails, color: 'text-violet-400', icon: <Mail size={12} /> },
                  { label: 'Meetings', value: stats.meetings, color: 'text-emerald-400', icon: <Zap size={12} /> },
                  { label: 'Resumes', value: stats.resumes, color: 'text-rose-400', icon: <Sparkles size={12} /> },
                  { label: 'Goals', value: stats.goals, color: 'text-white', icon: <Activity size={12} /> },
                ].map((stat, i) => (
                  <Card key={i} className="p-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col gap-1 items-center justify-center text-center">
                    <div className={`${stat.color} opacity-40 mb-1`}>{stat.icon}</div>
                    <p className="text-lg font-bold text-white tracking-tighter">{stat.value}</p>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <button 
              onClick={() => navigate('/chat')}
              className="p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Start Chat</h3>
                <p className="text-xs text-primary/70 mt-1">Direct reasoning link</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/doc-analyzer')}
              className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analyze Doc</h3>
                <p className="text-xs text-blue-400/70 mt-1">Upload & synthesize</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/writing-studio')}
              className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Type size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Write Studio</h3>
                <p className="text-xs text-amber-400/70 mt-1">Refine & transform</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/brainstormer')}
              className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Brainstorm</h3>
                <p className="text-xs text-amber-500/70 mt-1">Creative ideation</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/email-assistant')}
              className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Email AI</h3>
                <p className="text-xs text-violet-400/70 mt-1">Draft & optimize</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/meeting-notes')}
              className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meetings</h3>
                <p className="text-xs text-emerald-400/70 mt-1">Extract action items</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/resume-generator')}
              className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resumes</h3>
                <p className="text-xs text-rose-400/70 mt-1">Career assets</p>
              </div>
            </button>
          </section>

          {/* Recent Sessions */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Activity className="text-primary" size={20} />
                Recent Sessions
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { type: 'chat', label: 'Neural Chats', icon: <MessageSquare size={14} />, color: 'text-primary' },
                { type: 'doc', label: 'Doc Intelligence', icon: <FileText size={14} />, color: 'text-blue-400' },
                { type: 'writing', label: 'Writing Works', icon: <Type size={14} />, color: 'text-amber-400' },
                { type: 'brainstorm', label: 'Creative Ideas', icon: <Lightbulb size={14} />, color: 'text-amber-500' },
                { type: 'email', label: 'Email Drafts', icon: <Mail size={14} />, color: 'text-violet-400' },
                { type: 'meeting', label: 'Meeting Intel', icon: <Zap size={14} />, color: 'text-emerald-400' },
                { type: 'resume', label: 'Career Assets', icon: <Sparkles size={14} />, color: 'text-rose-400' }
              ].map(config => {
                const items = sessions.filter(s => s.type === config.type).slice(0, 3);

                return (
                  <Card key={config.type} className="p-5 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group overflow-hidden relative">
                    {/* Background glow on hover */}
                    <div className={`absolute -right-4 -top-4 w-12 h-12 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full bg-current ${config.color}`} />
                    
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                      {items.length > 0 && <span className="text-[10px] text-gray-700 font-bold">{items.length}</span>}
                    </div>
                    <div className="space-y-3">
                      {items.length > 0 ? items.map((s, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleResumeSession(s)}
                          className="flex justify-between items-start group/item cursor-pointer"
                        >
                           <div className="overflow-hidden flex-1">
                             <p className="text-xs text-gray-400 group-hover/item:text-white transition-colors truncate pr-4">{s.title}</p>
                             <p className="text-[10px] text-gray-600 mt-1">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(s.updatedAt).toLocaleDateString()}</p>
                           </div>
                           <ArrowRight size={12} className="text-gray-700 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0 group-hover/item:text-primary" />
                        </div>
                      )) : (
                        <div className="py-4 flex flex-col items-center justify-center opacity-30 grayscale scale-95 transition-all group-hover:grayscale-0 group-hover:opacity-50 group-hover:scale-100">
                           <History size={16} className="mb-2 text-gray-600" />
                           <p className="text-[10px] text-gray-600 italic">No recent activity.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* Intelligence Panel (Right) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Focus session link */}
          <Card className="p-6 bg-linear-to-br from-primary/10 via-transparent to-transparent border-primary/20 group hover:border-primary/50 transition-all">
             <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
               <Clock size={16} className="text-primary" />
               Focus Protocol
             </h3>
             <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Ready for a deep work session? Activate your session timers.
             </p>
             <Button onClick={() => navigate('/focus-session')} className="w-full text-xs gap-2">
               Enter Focus Session <ArrowRight size={14} />
             </Button>
          </Card>

          {/* Resume Session */}
          {lastActivity && (
            <Card className="p-6 border-white/5 group hover:border-primary/30 transition-all">
              <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px] opacity-50 flex items-center gap-2">
                <History size={14} />
                Resume Quick Link
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">{lastActivity.type} Link</p>
                  <p className="text-sm text-gray-200 font-medium line-clamp-1 mb-3">{lastActivity.title}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleResumeSession(lastActivity)}
                    className="w-full text-xs gap-2 border border-white/10 hover:bg-white/5"
                  >
                    Return to Session <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
