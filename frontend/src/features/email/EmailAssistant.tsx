import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Mail, 
    Sparkles, 
    Copy, 
    Download, 
    RefreshCw,
    Send,
    Bookmark,
    Plus,
    History as HistoryIcon
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../hooks/useSession';
import { SessionSidebar } from '../../components/shared/SessionSidebar';

const EmailAssistant: React.FC = () => {
    const {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        saveSession,
        createNewSession,
        setIsProcessing,
        loadSession
    } = useSession('email', { input: '', tone: 'formal' as const, output: '' });

    const navigate = useNavigate();
    const [originalEmail, setOriginalEmail] = useState('');
    const [includeTLDR, setIncludeTLDR] = useState(false);

    // Sync local state with hook state
    const topic = sessionContent.input || '';
    const tone = sessionContent.tone || 'formal';
    const result = sessionContent.output || '';

    const setTopic = (val: string) => setSessionContent({ ...sessionContent, input: val });
    const setTone = (val: 'formal' | 'friendly' | 'apology') => setSessionContent({ ...sessionContent, tone: val });
    const setResult = (val: string) => setSessionContent({ ...sessionContent, output: val });


    const handleGenerate = async () => {
        if (!topic.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            let advancedPrompt = `Topic/Content: ${topic}\ntone: ${tone}`;
            if (originalEmail.trim()) {
                advancedPrompt += `\n\nCONTEXT-AWARE TONE MAPPING REQUIRED:\nThe user received this original email:\n"${originalEmail}"\n\nAnalyze the psychological tone and sentiment of this received email. Adjust your generated reply to perfectly match that tone (e.g., if it is highly formal, respond highly formally. If it is empathetic, match it). Ensure the reply still covers the Topic/Content provided.`;
            }

            if (includeTLDR) {
                advancedPrompt += `\n\nEXECUTIVE TL;DR REQUIRED:\nAt the very beginning of the email, before the greeting, output a bolded, 1-sentence "TL;DR:" summarizing the entire email for a busy executive reader.`;
            }

            const response = await api.post<any>('/api/write', {
                type: 'email',
                text: advancedPrompt,
                sessionId: activeSessionId
            });
            
            const resultData = response.data; 
            
            const newContent = {
                input: topic,
                tone: tone,
                output: resultData.result || ''
            };

            await saveSession(newContent, `Email: ${topic.slice(0, 30)}...`);
            
            if (resultData.result) {
                setResult(resultData.result);
            }
        } catch (error: any) {
            console.error('Email Assistant Error:', error);
            alert('Failed to generate email. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveToKnowledge = async () => {
        if (!result || isProcessing) return;
        try {
            await api.post('/api/knowledge', {
                title: `Email: ${topic.slice(0, 30)}...`,
                content: result,
                type: 'text'
            });
            alert('Saved to Knowledge Base!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save to Knowledge Base.');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        alert('Copied to clipboard!');
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([result], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "generated_email.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-2"
                    >
                        <Mail size={16} className="text-violet-400" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-violet-400">Workplace Suite</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight uppercase">Email Assistant</h1>
                    <p className="text-gray-400">Professional correspondence powered by neural reasoning.</p>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={createNewSession}
                    className="text-xs gap-2 border border-white/10"
                >
                    <Plus size={14} /> New Draft
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Drafts Sidebar */}
                <div className="lg:col-span-3 hidden lg:block">
                    <SessionSidebar 
                        title="Recent Drafts"
                        sessions={recentSessions}
                        activeSessionId={activeSessionId}
                        onSessionSelect={(id) => navigate(`?session=${id}`)}
                        onNewSession={createNewSession}
                    />
                </div>

                <Card className="p-6 space-y-6 lg:col-span-4 border-white/5 bg-[#141417]/50 backdrop-blur-3xl">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                            <span>1. Original Received Email <span className="text-[10px] text-violet-400 font-normal lowercase">(For Tone Mapping)</span></span>
                        </label>
                        <textarea 
                            value={originalEmail}
                            onChange={(e) => setOriginalEmail(e.target.value)}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-violet-500/50 transition-all resize-none font-light"
                            placeholder="Optional: Paste the email you are replying to here..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. What do you want to say?</label>
                        <textarea 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-violet-500/50 transition-all resize-none font-light"
                            placeholder="e.g. Write a leave request for 2 days next week due to personal reasons."
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">3. Base Tone Overrides</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(['formal', 'friendly', 'apology'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left capitalize ${
                                        tone === t 
                                        ? 'bg-violet-500/20 border-violet-500 text-violet-400' 
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIncludeTLDR(!includeTLDR)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${includeTLDR ? 'bg-violet-500 border-violet-500' : 'border-white/20'}`}>
                                {includeTLDR && <Sparkles size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-200 font-medium">Add Executive TL;DR Box</span>
                                <span className="text-[10px] text-gray-400">Auto-prepends a 1-sentence bold summary at the top</span>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        disabled={isProcessing || !topic.trim()}
                        className="w-full gap-2 py-6 bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-lg shadow-violet-600/20"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {result ? 'Regenerate Email' : 'Generate Email'}
                    </Button>
                </Card>

                <div className="lg:col-span-5">
                    <Card className="h-full min-h-[500px] flex flex-col border-white/5 bg-[#141417]/50 backdrop-blur-3xl overflow-hidden relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-violet-400 animate-pulse uppercase tracking-widest">Neural Drafting...</span>
                                </div>
                            </div>
                        )}
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Neural Output</span>
                            {result && (
                                <div className="flex gap-2">
                                    <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all shadow-sm" title="Download">
                                        <Download size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto">
                            {result ? (
                                <div className="whitespace-pre-wrap text-gray-200 leading-relaxed font-light text-lg">
                                    {result}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                    <Mail size={48} className="mb-4" />
                                    <p className="text-sm font-medium">Your generated email will appear here.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EmailAssistant;
