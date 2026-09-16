import React, { useState, useRef, useEffect } from 'react';
import { AppView, ChatMessage as IChatMessage } from '@/types';
import { askNexus, saveLiveInteraction } from '@/services/aiService';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { api } from '@/services/apiClient';

type ChatInterfaceProps = {
  mode?: AppView;
};

const modeTitleMap: Partial<Record<AppView, string>> = {
  [AppView.CHAT]: 'Neural Chat',
  [AppView.DOC_ANALYZER]: 'Doc Intelligence'
};

const modePromptMap: Partial<Record<AppView, string>> = {
  [AppView.DOC_ANALYZER]:
    'You are Doc Intelligence. Extract key points, themes, risks, and recommended actions from the provided content.'
};

import { useSearchParams } from 'react-router-dom';
import { getSessionById } from '@/services/dashboardService';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [aiPersona, setAiPersona] = useState<'Default' | 'Devils Advocate' | 'Socratic Mentor'>('Default');
  const [deepThinking, setDeepThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamSessionRef = useRef(0);

  const title = mode ? (modeTitleMap[mode] ?? 'Neural Chat') : 'Neural Chat';
  const modePrompt = mode ? (modePromptMap[mode] ?? '') : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    async function loadSession() {
      const sessionId = searchParams.get('session');
      if (sessionId) {
        setIsLoading(true);
        try {
          const session = await getSessionById(sessionId);
          if (session && session.type === 'chat') {
            const mappedMessages: IChatMessage[] = session.content.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              text: m.content,
              timestamp: new Date(m.timestamp).getTime()
            }));
            setMessages(mappedMessages);
            setActiveSessionId(sessionId);
          }
        } catch (error) {
          console.error("Failed to load session:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset chat state when switching between chat modes.
        streamSessionRef.current += 1;
        setMessages([]);
        setActiveSessionId(null);
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
    loadSession();
  }, [mode, searchParams]);

  const simulateStreaming = async (fullText: string, sessionId: number) => {
    setIsStreaming(true);
    const aiMsg: IChatMessage = {
      role: 'model',
      text: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);

    const chunkSize = 5;
    let currentText = '';

    for (let i = 0; i < fullText.length; i += chunkSize) {
      if (streamSessionRef.current !== sessionId) return;

      const chunk = fullText.slice(i, i + chunkSize);
      currentText += chunk;

      setMessages(prev => {
        const newArr = [...prev];
        const lastMsg = newArr[newArr.length - 1];
        if (lastMsg.role === 'model') {
          lastMsg.text = currentText;
        }
        return newArr;
      });

      await new Promise(r => setTimeout(r, 15)); // Typing speed
    }

    if (streamSessionRef.current === sessionId) setIsStreaming(false);
  };

  const handleSend = async (text: string, isVoice?: boolean) => {
    if (!text.trim() || isLoading) return;

    // Add User Message
    const userMsg: IChatMessage = {
      role: 'user',
      text: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    const sessionId = streamSessionRef.current + 1;
    streamSessionRef.current = sessionId;

    try {
      // Get full response from API
      let advancedContext = "";
      if (messages.length > 0) {
          const past = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
          advancedContext += `\n[SEMANTIC MEMORY - PAST CONTEXT]\n${past}\n`;
      }
      advancedContext += `\n[REAL-TIME GROUNDING]:\nThe current date/time is ${new Date().toISOString()}.\n`;

      if (aiPersona === 'Devils Advocate') {
          advancedContext += `\n[PERSONA: DEVIL's ADVOCATE]:\nYou must aggressively critique and argue AGAINST everything the user says. Find flaws in their logic.`;
      } else if (aiPersona === 'Socratic Mentor') {
          advancedContext += `\n[PERSONA: SOCRATIC MENTOR]:\nYou must NEVER give the direct answer. Only guide the user by asking deep, probing questions.`;
      }

      if (deepThinking) {
          advancedContext += `\n[DEEP THINKING MODE]:\nBefore answering, please output a detailed <chain_of_thought> explaining your step-by-step reasoning logic before providing your final response.`;
      }
      
      const effectiveText = modePrompt
        ? `${modePrompt}\n\n${advancedContext}\n\nUser request:\n${text}`
        : `${advancedContext}\n\n${text}`;

      // Import api from apiClient if not already or use a custom service
      // For now, I'll use the askNexus but I need it to return sessionId
      // Actually, I'll modify the backend call directly here or update the service.
      
      const response = await api.post<{ data: { reply: string, sessionId: string } }>('/api/chat', {
        message: effectiveText,
        sessionId: activeSessionId
      });

      const responseText = response.data.reply;
      if (response.data.sessionId) {
        setActiveSessionId(response.data.sessionId);
      }

      // ─── Live Interaction Sync ─────────────────────────────────
      if (isVoice) {
         try {
           // Save to specialized live interaction collection
           await saveLiveInteraction(
             [`User: ${text}`, `Assistant: ${responseText}`],
             0 // Duration could be tracked if needed
           );
         } catch (e) {
           console.warn("Failed to sync to LiveInteraction model", e);
         }
      }
      // ────────────────────────────────────────────────────────────

      // Start streaming simulation
      setIsLoading(false);
      await simulateStreaming(responseText, sessionId);

    } catch (error: any) {
      console.error("Chat Error:", error);
      
      let errorText = "I encountered a neural synchronization error. Please try again.";
      
      // Try to extract the backend message if available (apiClient throws formatted string)
      try {
        const msg = error.message || "";
        if (msg.includes('{')) {
          const jsonStr = msg.substring(msg.indexOf('{'));
          const parsed = JSON.parse(jsonStr);
          if (parsed.message) errorText = parsed.message;
        }
      } catch (e) {
        console.warn("Could not parse backend error response");
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: errorText,
        timestamp: Date.now()
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1115] relative overflow-hidden">
      <ChatHeader title={title} />
      
      <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-b border-white/5 shrink-0 z-10">
         <div className="flex items-center gap-4">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Persona:</span>
             <select 
                value={aiPersona} 
                onChange={e => setAiPersona(e.target.value as any)}
                className="bg-transparent text-xs text-primary font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer hover:text-white transition-colors"
                disabled={isLoading}
             >
                 <option value="Default" className="bg-black">Default Assistant</option>
                 <option value="Devils Advocate" className="bg-black">Devil's Advocate</option>
                 <option value="Socratic Mentor" className="bg-black">Socratic Mentor</option>
             </select>
         </div>
         <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Deep Thinking Mode</span>
            <div className={`w-8 h-4 rounded-full transition-all relative ${deepThinking ? 'bg-primary shadow-[0_0_10px_-2px_rgba(139,92,246,0.5)]' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${deepThinking ? 'left-4.5' : 'left-0.5'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={deepThinking} onChange={() => setDeepThinking(!deepThinking)} disabled={isLoading} />
         </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center opacity-50 select-none animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Nexus Enterprise OS</h2>
              <p className="text-sm text-gray-400 max-w-sm">
                Ready to accelerate your productivity. Ask me anything about {title}.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.text}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'model'}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-primary/50 text-xs font-mono ml-16 animate-pulse">
              <span>Thinking</span>
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce delay-75" />
                <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce delay-150" />
                <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce delay-300" />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading || isStreaming} />
    </div>
  );
};

export default ChatInterface;
