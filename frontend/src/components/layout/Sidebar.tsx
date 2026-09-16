import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppView } from '@/types';
import {
  LayoutDashboard,
  Mic,
  MessageSquare,
  FileText,
  Lightbulb,
  CheckSquare,
  Database,
  Video,
  Smile,
  Type,
  User,
  Terminal,
  BarChart3,
  TrendingUp,
  School,
  FileSearch,
  FlaskConical,
  Calendar,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Target,
  User as UserIcon,
  Mail,
  Palette,
  History,
  Sparkles,
  Loader2,
  Brain,
  Layout,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralAvatar } from '../ui/NeuralAvatar';
import { useStore } from '@/store/useStore';
import { LogoutModal } from '../shared/LogoutModal';

interface SidebarProps {
  // activeView: AppView; // Removed as NavLink handles active state
  // onViewChange: (view: AppView) => void; // Removed as NavLink handles navigation
}

const Sidebar: React.FC<SidebarProps> = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useStore();

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Command Center', icon: LayoutDashboard, path: '/' },
    { id: AppView.CHAT, label: 'Neural Chat', icon: MessageSquare, path: '/chat' },
    { id: AppView.WRITING_STUDIO, label: 'Writing Studio', icon: Type, path: '/writing-studio' },
    { id: AppView.DOC_ANALYZER, label: 'Doc Analyzer', icon: FileText, path: '/doc-analyzer' },
    { id: AppView.BRAINSTORMER, label: 'Brainstormer', icon: Lightbulb, path: '/brainstormer' },
    { id: AppView.GOAL_TRACKER, label: 'Goal & OKR', icon: Target, path: '/goal-tracker' },
    { id: AppView.KNOWLEDGE_BASE, label: 'Knowledge Base', icon: Database, path: '/knowledge' },
    { id: AppView.FOCUS_SESSION, label: 'Focus Session', icon: Clock, path: '/focus-session' },
    { id: AppView.EMAIL_ASSISTANT, label: 'Email Assistant', icon: Mic, path: '/email-assistant' },
    { id: AppView.MEETING_NOTES, label: 'Meeting Notes', icon: MessageSquare, path: '/meeting-notes' },
    { id: AppView.RESUME_GENERATOR, label: 'Resume Generator', icon: FileSearch, path: '/resume-generator' },
  ];

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
      className="h-screen bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-50 shadow-2xl"
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 z-50 p-1.5 rounded-full bg-surface border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 transition-all duration-200 shadow-lg backdrop-blur-sm"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-6 flex items-center justify-between">
        <NavLink 
          to="/" 
          className="flex items-center gap-3 group/logo transition-all hover:scale-[1.02] active:scale-95"
        >
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-blue-500 shadow-lg shadow-primary/30 flex items-center justify-center group-hover/logo:shadow-primary/50 transition-all">
                  <span className="font-bold text-white">N</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight text-white group-hover/logo:text-primary transition-colors">NexusAI</h1>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Enterprise OS</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 mx-auto rounded-lg bg-linear-to-tr from-primary to-blue-500 shadow-lg shadow-primary/30 flex items-center justify-center group-hover/logo:shadow-primary/50 transition-all"
              >
                <span className="font-bold text-white">N</span>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      <nav className={`flex-1 px-4 py-6 space-y-2 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto custom-scrollbar'}`}>
        {menuItems.map((item) => {
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
                ${isActive ? 'bg-primary/10 text-white shadow-lg shadow-primary/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    />
                  )}
                  <item.icon
                    size={20}
                    className={`relative z-10 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`ml-4 text-sm font-medium relative z-10 ${isActive ? 'text-white' : ''}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900/90 backdrop-blur-md text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-60 pointer-events-none border border-white/10 shadow-xl">
                      {item.label}
                      {/* Arrow for tooltip */}
                      <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900/90" />
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        {/* User Profile */}
        <NavLink
          to="/settings"
          className={({ isActive }) => `
            w-full flex items-center p-3 rounded-xl transition-all duration-200 border
            ${isActive ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/10' : 'bg-white/5 border-transparent hover:bg-white/10'}
            ${isCollapsed ? 'justify-center' : ''} group relative
          `}
        >
          <div className={`shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 ${isCollapsed ? '' : 'mr-3'}`}>
            <UserIcon size={20} className="text-primary" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold text-foreground truncate">
                {user?.full_name || 'User'}
              </div>
              <div className="text-[10px] text-muted truncate">
                {user?.email}
              </div>
              <div className="flex items-center text-[10px] text-emerald-500 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-sm shadow-emerald-500/50" />
                Online
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900/90 backdrop-blur-md text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-60 pointer-events-none border border-white/10 shadow-xl">
              {user?.full_name || 'View Profile'}
              <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900/90" />
            </div>
          )}
        </NavLink>

        <div className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
              ${isActive ? 'bg-primary/10 text-white shadow-lg shadow-primary/10' : 'hover:bg-white/5 text-gray-400 hover:text-white'}
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTabBottom"
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  />
                )}
                <Settings size={20} className={`relative z-10 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                {!isCollapsed && <span className={`ml-4 text-sm font-medium relative z-10 ${isActive ? 'text-white' : ''}`}>Settings</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900/90 backdrop-blur-md text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-60 pointer-events-none border border-white/10 shadow-xl">
                    Settings
                    <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900/90" />
                  </div>
                )}
              </>
            )}
          </NavLink>
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className={`w-full flex items-center p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''} group relative`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="ml-4 text-sm font-medium">Logout</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900/90 backdrop-blur-md text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-60 pointer-events-none border border-white/10 shadow-xl">
                Logout
                <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-gray-900/90" />
              </div>
            )}
          </button>
        </div>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          await useStore.getState().logout();
          window.location.reload();
        }}
      />
    </motion.aside>
  );
};

export default Sidebar;
