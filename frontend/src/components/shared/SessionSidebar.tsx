import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Session } from '../../services/sessionService';

interface SessionSidebarProps {
    sessions: Session[];
    activeSessionId: string | null;
    onSessionSelect: (id: string) => void;
    onNewSession: () => void;
    title: string;
    isProcessing?: boolean;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
    sessions,
    activeSessionId,
    onSessionSelect,
    onNewSession,
    title,
    isProcessing = false
}) => {
    return (
        <Card className="p-6 border-white/5 bg-[#141417]/50 backdrop-blur-3xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <HistoryIcon size={14} />
                    {title}
                </h3>
                <Button 
                    variant="ghost" 
                    onClick={onNewSession}
                    className="h-8 w-8 p-0 rounded-full border border-white/5 bg-white/5 hover:bg-white/10"
                    title="New Session"
                >
                    <Plus size={14} />
                </Button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {sessions.length > 0 ? (
                    sessions.map((s) => (
                        <motion.div 
                            key={s._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSessionSelect(s._id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                                activeSessionId === s._id 
                                ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/5' 
                                : 'bg-white/5 border-transparent hover:border-white/10'
                            }`}
                        >
                            <p className="text-xs font-semibold text-gray-300 group-hover:text-white truncate mb-1">
                                {s.title || 'Untitled Session'}
                            </p>
                            <div className="flex justify-between items-center">
                                <p className="text-[9px] text-gray-600 font-medium whitespace-nowrap">
                                    {new Date(s.updatedAt).toLocaleDateString()}
                                </p>
                                {activeSessionId === s._id && (
                                    <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20 italic space-y-2">
                        <HistoryIcon size={24} className="mb-2" />
                        <p className="text-[10px] uppercase tracking-widest font-bold">No History</p>
                    </div>
                )}
            </div>
            
            {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
                </div>
            )}
        </Card>
    );
};
