import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Sparkles, 
    Copy, 
    Download, 
    RefreshCw,
    FileText,
    Bookmark,
    Zap,
    Plus,
    History as HistoryIcon,
    Target,
    Mic,
    MicOff,
    Loader2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { useSession } from '../../hooks/useSession';
import { SessionSidebar } from '../../components/shared/SessionSidebar';
import { createGoal } from '../../services/goalService';

const MeetingNotes: React.FC = () => {
    const {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        saveSession,
        createNewSession,
        setIsProcessing
    } = useSession('meeting', { input: '', output: '' });

    const navigate = useNavigate();

    // Sync local state
    const transcript = sessionContent.input || '';
    const result = sessionContent.output || '';
    const [extractQuestions, setExtractQuestions] = useState(false);

    const setTranscript = (val: string) => setSessionContent({ ...sessionContent, input: val });
    const setResult = (val: string) => setSessionContent({ ...sessionContent, output: val });

    const [isRecording, setIsRecording] = useState(false);
    const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    useEffect(() => {
        if (shouldAutoGenerate && !isRecording && transcript.trim() && !isProcessing) {
            handleGenerate();
            setShouldAutoGenerate(false);
        } else if (shouldAutoGenerate && !transcript.trim()) {
            setShouldAutoGenerate(false);
        }
    }, [shouldAutoGenerate, isRecording, transcript, isProcessing]);

    const startRecording = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Live transcription is not supported in this browser. Please use Google Chrome or Edge.');
            return;
        }
        
        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onstart = () => {
                setIsRecording(true);
                setShouldAutoGenerate(false);
            };
            
            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        currentTranscript += event.results[i][0].transcript.trim() + ' ';
                    }
                }
                
                if (currentTranscript) {
                    setSessionContent(prev => {
                        const safePrev = prev.input || '';
                        return { ...prev, input: safePrev + (safePrev.endsWith(' ') ? '' : ' ') + currentTranscript };
                    });
                }
            };
            
            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone access denied. Please allow microphone permissions.");
                }
                setIsRecording(false);
            };
            
            recognition.onend = () => {
                setIsRecording(false);
            };
            
            recognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.error(e);
            alert("Failed to initialize speech recognition.");
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
        setShouldAutoGenerate(true);
    };

    const handleGenerate = async () => {
        if (!transcript.trim() || isProcessing) return;

        setIsProcessing(true);
        try {
            let advancedTranscript = transcript;
            if (extractQuestions) {
                advancedTranscript += `\n\nUNRESOLVED QUESTIONS EXTRACTION REQUIRED:\nPlease add a dedicated section at the end of the summary titled "Unresolved Questions". Carefully analyze the transcript and list any questions that were raised by participants but uniquely never received a final, clear answer or conclusion during the meeting.`;
            }

            const response = await api.post<any>('/api/write', {
                type: 'meeting',
                text: advancedTranscript,
                sessionId: activeSessionId
            });
            
            const resultData = response.data;
            
            const newContent = {
                input: transcript,
                output: resultData.result || ''
            };

            await saveSession(newContent, `Meeting: ${transcript.slice(0, 30)}...`);

            if (resultData.result) {
                setResult(resultData.result);
            }
        } catch (error: any) {
            console.error('Meeting Notes Error:', error);
            alert('Failed to summarize notes. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveToKnowledge = async () => {
        if (!result || isProcessing) return;
        try {
            await api.post('/api/knowledge', {
                title: `Meeting Summary: ${transcript.slice(0, 30)}...`,
                content: result,
                type: 'meeting'
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
        element.download = "meeting_summary.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handlePushActionItems = async () => {
        if (!result || isProcessing) return;
        setIsProcessing(true);
        try {
            const lines = result.split('\n');
            const actionItems: string[] = [];
            let inActionItemsSection = false;
            
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('action item') || lowerLine.includes('next steps') || lowerLine.includes('to-do')) {
                    inActionItemsSection = true;
                    continue;
                }
                
                if (inActionItemsSection) {
                    if (line.trim() === '') continue;
                    if (line.startsWith('#') && !lowerLine.includes('action')) {
                        inActionItemsSection = false;
                        continue;
                    }
                    
                    const match = line.match(/^[\s]*[-*•]|^{?\d+\.}[\s]*(.*)/);
                    if (match && match[1] && match[1].trim().length > 3) {
                        let cleanText = match[1].replace(/\*\*/g, '').trim();
                        actionItems.push(cleanText);
                    }
                }
            }
            
            if (actionItems.length === 0) {
               alert("Could not find an 'Action Items' section. Please ensure the summary includes bullet points under an 'Action Items' header.");
               setIsProcessing(false);
               return;
            }

            let createdCount = 0;
            for (const item of actionItems) {
                await createGoal({
                    title: `${item.slice(0, 100)}`,
                    category: 'Work',
                    status: 'active',
                    progress: 0
                });
                createdCount++;
            }
            
            alert(`Accountability Engine Triggered: Successfully pushed ${createdCount} action items to your Predictive Goal Tracker!`);
        } catch (error) {
            console.error(error);
            alert("Failed to push action items to the Goal Tracker.");
        } finally {
            setIsProcessing(false);
        }
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
                        <Zap size={16} className="text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-emerald-400">Workplace Suite</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight uppercase">Meeting Notes</h1>
                    <p className="text-gray-400">Extract executive intelligence from your transcripts.</p>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={createNewSession}
                    className="text-xs gap-2 border border-white/10"
                >
                    <Plus size={14} /> New Session
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Intel Sidebar */}
                <div className="lg:col-span-3 hidden lg:block">
                    <SessionSidebar 
                        title="Recent Intel"
                        sessions={recentSessions}
                        activeSessionId={activeSessionId}
                        onSessionSelect={(id) => navigate(`?session=${id}`)}
                        onNewSession={createNewSession}
                    />
                </div>

                <Card className="p-6 space-y-6 lg:col-span-4 border-white/5 bg-[#141417]/50 backdrop-blur-3xl">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting Transcript</label>
                        {isRecording ? (
                            <button 
                                onClick={stopRecording}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold animate-pulse hover:bg-red-500/30 transition-all shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]"
                            >
                                <MicOff size={14} /> Stop & Auto-Summarize
                            </button>
                        ) : (
                            <button 
                                onClick={startRecording}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-gray-300 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                                title="Uses your device microphone"
                            >
                                <Mic size={14} /> Start Auto-Transcription
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 relative">
                        <textarea 
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="w-full h-80 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all resize-none font-light"
                            placeholder="Paste your meeting notes here, or click 'Start Auto-Transcription' to use your microphone..."
                        />
                        {isRecording && (
                            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-emerald-400 text-xs font-bold bg-[#141417] px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                                Listening...
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setExtractQuestions(!extractQuestions)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${extractQuestions ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                            {extractQuestions && <Sparkles size={12} className="text-white" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-200 font-medium">Unresolved Questions Extractor</span>
                            <span className="text-[10px] text-gray-400">Creates a dedicated list of questions asked but never finally answered</span>
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        disabled={isProcessing || !transcript.trim()}
                        className="w-full gap-2 py-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-600/20"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {result ? 'Regenerate Summary' : 'Summarize Meeting'}
                    </Button>
                </Card>

                <div className="lg:col-span-5">
                    <Card className="h-full min-h-[500px] flex flex-col border-white/5 bg-[#141417]/50 backdrop-blur-3xl overflow-hidden relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-emerald-400 animate-pulse uppercase tracking-widest">Deep Summarizing...</span>
                                </div>
                            </div>
                        )}
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Executive Summary</span>
                            {result && (
                                <div className="flex gap-2">
                                    <button onClick={handlePushActionItems} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 hover:border-primary/50 text-[10px] uppercase font-bold tracking-widest rounded transition-all flex items-center gap-2" title="Push Action Items to Timeline">
                                        <Target size={12} /> Push to Goal Tracker
                                    </button>
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
                                    <FileText size={48} className="mb-4" />
                                    <p className="text-sm font-medium">Your summary and action items will appear here.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MeetingNotes;
