import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Type, 
    AlignLeft, 
    Maximize2, 
    Minimize2, 
    Languages, 
    CheckCircle2,
    Save,
    RotateCcw,
    History as HistoryIcon,
    X,
    Clock
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../hooks/useSession';
import { SessionSidebar } from '../../components/shared/SessionSidebar';

const WritingStudio: React.FC = () => {
    const {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        saveSession,
        createNewSession,
        setIsProcessing
    } = useSession('writing', { output: '' });

    const navigate = useNavigate();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [writingSample, setWritingSample] = useState('');
    const [audienceLevel, setAudienceLevel] = useState<number>(3);
    const audienceLevels = ["Explain like I'm 5", "Casual", "Professional", "Academic", "PhD Level"];

    // Sync local state
    const content = sessionContent.output || '';
    const setContent = (val: string) => setSessionContent({ ...sessionContent, output: val });

    const aiOptions = [
        { id: 'shorten', label: 'Shorten', icon: <Minimize2 size={14} /> },
        { id: 'expand', label: 'Expand', icon: <Maximize2 size={14} /> },
        { id: 'grammar', label: 'Fix Grammar', icon: <CheckCircle2 size={14} /> },
        { id: 'translate', label: 'Translate', icon: <Languages size={14} /> },
    ];

    const toggleHistory = () => {
        setIsHistoryOpen(!isHistoryOpen);
    };

    const handleAiAction = async (type: string) => {

        if (!content.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            let advancedContent = content;
            if (writingSample.trim()) {
                advancedContent += `\n\n[VOICE & STYLE CLONING REQUIREMENTS]:\nPlease analyze and absolutely mimic the vocabulary, rhythm, and style of this exact sample: "${writingSample}"`;
            }
            advancedContent += `\n\n[DYNAMIC AUDIENCE SLIDER]:\nThe target audience complexity is: ${audienceLevels[audienceLevel - 1]}. Adjust your response complexity accordingly.`;

            const response = await api.post<any>('/api/write', {
                type,
                text: advancedContent
            });
            
            // Map backend response
            const result = response.data?.result || response.result || response;
            
            if (result) {
                setContent(result);
                await saveSession({ output: result }, result.slice(0, 40) + "...");
            }
        } catch (error: any) {
            console.error('AI Writing Tool Error:', error);
            
            let errorMsg = 'Failed to process text. Please check your connection.';
            if (error.message && error.message.includes('{')) {
                try {
                    const jsonStr = error.message.substring(error.message.indexOf('{'));
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.message) errorMsg = parsed.message;
                } catch (e) {}
            }
            alert(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim() || isProcessing) return;
        try {
            await saveSession({ output: content }, content.slice(0, 40) + "...");
            alert('Content saved to your history!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save content.');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 relative">
            <header className="flex items-center justify-between">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-2"
                    >
                        <Type size={16} className="text-primary" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Creative Suite</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-2">Writing Studio</h1>
                    <p className="text-gray-400">High-performance AI editor for elite content creation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-2" onClick={toggleHistory}>
                        <RotateCcw size={14} /> History
                    </Button>
                    <Button 
                        size="sm" 
                        className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                        onClick={handleSave}
                        isLoading={isProcessing}
                    >
                        <Save size={14} /> Finish
                    </Button>
                </div>
            </header>

            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Editor Section */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="p-0 overflow-hidden border-white/5 bg-[#141417]/50 backdrop-blur-3xl shadow-2xl relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-primary animate-pulse">Neural Processing...</span>
                                </div>
                            </div>
                        )}
                        <div className="px-6 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sans-Serif</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Auto-Save On</span>
                            </div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{content.length} characters</span>
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isProcessing}
                            className="w-full h-[600px] bg-transparent text-white p-8 placeholder-gray-800 outline-none resize-none text-xl leading-[1.8] font-light"
                            placeholder="Type your content... Use side tools to refine."
                        />
                    </Card>
                </div>

                {/* AI Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-4">Neural Tools</h3>
                    <div className="space-y-2">
                        {aiOptions.map((opt) => (
                            <button 
                                key={opt.id}
                                onClick={() => handleAiAction(opt.id)}
                                disabled={isProcessing}
                                className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left flex items-center gap-3 group"
                            >
                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20">
                                    {opt.icon}
                                </div>
                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    <Card className="p-6 bg-linear-to-b from-primary/10 to-transparent border-primary/20 mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-primary" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Global Assist</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">
                            Need a total rewrite? Specify your goal and let Nexus AI handle the draft.
                        </p>
                        <Button 
                            className="w-full text-xs py-5"
                            onClick={() => handleAiAction('rewrite')}
                            isLoading={isProcessing}
                            disabled={!content.trim()}
                        >
                            Summon AI Draft
                        </Button>

                    </Card>

                    <Card className="p-6 bg-white/5 border-white/10 mt-6">
                        <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-4 block">Voice & Style Cloning</label>
                        <textarea 
                            value={writingSample}
                            onChange={(e) => setWritingSample(e.target.value)}
                            disabled={isProcessing}
                            placeholder="Paste a sample of your own writing here to clone your style..."
                            className="w-full h-20 bg-black/20 p-3 text-xs text-white rounded-lg outline-none border border-white/5 resize-none focus:border-primary/50 transition-colors custom-scrollbar"
                        />
                        <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-6 mb-4 block">Dynamic Audience Slider</label>
                        <input 
                            type="range" min="1" max="5" value={audienceLevel} onChange={(e) => setAudienceLevel(parseInt(e.target.value))}
                            className="w-full accent-primary"
                            disabled={isProcessing}
                        />
                        <div className="text-center text-[10px] text-primary mt-2 font-bold uppercase tracking-widest">{audienceLevels[audienceLevel - 1]}</div>
                    </Card>
                </div>
            </div>

            {/* History Sidebar */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-80 bg-[#0f1115] border-l border-white/10 z-50 shadow-2xl p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Clock size={16} className="text-primary" />
                                    Writing History
                                </h3>
                                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                             <div className="flex-1 overflow-hidden">
                                <SessionSidebar 
                                    title="Writing History"
                                    sessions={recentSessions}
                                    activeSessionId={activeSessionId}
                                    onSessionSelect={(id) => {
                                        navigate(`?session=${id}`);
                                        setIsHistoryOpen(false);
                                    }}
                                    onNewSession={() => {
                                        createNewSession();
                                        setIsHistoryOpen(false);
                                    }}
                                />
                             </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WritingStudio;

