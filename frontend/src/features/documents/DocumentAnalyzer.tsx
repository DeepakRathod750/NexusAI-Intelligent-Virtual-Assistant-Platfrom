import React, { useState, useRef } from 'react';
import { FileText, Upload, ChevronRight, File, Loader2, Play, Plus, X } from 'lucide-react';
import { AnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/apiClient';
import { analyzeDocumentTextOnly } from '@/services/aiService';
import { useSearchParams } from 'react-router-dom';
import { getSessionById } from '@/services/dashboardService';

const DocumentAnalyzer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [secondaryContext, setSecondaryContext] = useState('');
  const [identifyBlindSpots, setIdentifyBlindSpots] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadSession() {
        const sessionId = searchParams.get('session');
        if (sessionId) {
            setIsAnalyzing(true);
            try {
                const session = await getSessionById(sessionId);
                if (session && session.type === 'doc' && session.content) {
                    // content: { text: '...', summary: '...', keyPoints: [], insights: [] }
                    setContent(session.content.text || '');
                    setResult({
                        summary: session.content.summary || '',
                        keyPoints: session.content.keyPoints || [],
                        actionItems: session.content.insights || []
                    });
                    setActiveSessionId(sessionId);
                }
            } catch (error) {
                console.error("Failed to load document session:", error);
            } finally {
                setIsAnalyzing(false);
            }
        }
    }
    loadSession();
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setContent(''); // Clear text when file is selected
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!content.trim() && !selectedFile) return;
    
    setIsAnalyzing(true);
    try {
      let responseData: any;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (activeSessionId) {
          formData.append('sessionId', activeSessionId);
        }
        
        // Use raw fetch for FormData as our api helper might not handle it depending on implementation
        const token = localStorage.getItem('access-token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const rawResponse = await fetch(`${baseUrl}/api/doc-analyze/analyze`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        
        if (!rawResponse.ok) throw new Error('Upload failed');
        const json = await rawResponse.json();
        responseData = json.data || json;
      } else {
        let advancedContent = content;
        if (secondaryContext.trim()) {
            advancedContent += `\n\n[CONTRADICTION & COMPLIANCE ENGINE RUNNING]:\nPlease cross-reference the original document with this SECONDARY document context: "${secondaryContext}". Highlight any logical contradictions or compliance issues between them.`;
        }
        if (identifyBlindSpots) {
            advancedContent += `\n\n[BLIND-SPOT IDENTIFIER]:\nPlease explicitly state what critical information or logical steps are MISSING from the original document that normally should be present.`;
        }
        const response = await api.post<any>('/api/ai/analyze', {
          text: advancedContent,
          filename: 'Text Input',
          sessionId: activeSessionId
        });
        // Axios response.data is the body { success, message, data }
        responseData = response.data?.data || response.data || response;
      }

      if (responseData.sessionId) {
        setActiveSessionId(responseData.sessionId);
      }

      // Map OpenAI response format to our UI interface
      const finalResult: AnalysisResult = {
        summary: responseData.summary || '',
        keyPoints: responseData.keyPoints || [],
        actionItems: responseData.actionItems || responseData.insights || []
      };

      setResult(finalResult);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Analysis failed: ${errorMessage}\n\nPlease ensure the backend is running and you uploaded a supported file type (PDF, DOCX, TXT, XLSX, PPTX).`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const AnalysisSection = ({ title, items, color = "primary" }: { title: string, items: string[], color?: "primary" | "secondary" | "accent" }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 text-sm text-gray-200 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <span className="text-primary font-mono select-none">{String(i + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* Input Section */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <header>
          <h2 className="text-2xl font-bold text-white tracking-tight">Doc Analyzer</h2>
          <p className="text-sm text-gray-400 mt-1">Extract structured insights from raw text.</p>
        </header>

        <Card className="flex-1 flex flex-col p-4 bg-[#0f1115]/50 overflow-hidden relative border-white/5">
          {selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <File className="text-primary" size={32} />
              </div>
              <h4 className="text-white font-medium mb-1 truncate max-w-full px-4">{selectedFile.name}</h4>
              <p className="text-xs text-gray-500 mb-6">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p>
              <button 
                onClick={clearSelection}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                disabled={isAnalyzing}
              >
                <X size={12} /> Remove file
              </button>
            </div>
          ) : (
            <textarea
              className="flex-1 bg-transparent resize-none border-none outline-none text-sm text-gray-300 placeholder:text-gray-600 custom-scrollbar"
              placeholder="Paste document text here or click + to upload a file..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAnalyzing}
            />
          )}

          <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
              {!selectedFile && (
                  <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center justify-between">
                              <span>Cross-Reference / Secondary Context</span>
                          </label>
                          <textarea 
                              value={secondaryContext}
                              onChange={(e) => setSecondaryContext(e.target.value)}
                              disabled={isAnalyzing}
                              className="w-full h-16 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-[11px] outline-none focus:border-primary/50 transition-all resize-none custom-scrollbar"
                              placeholder="Optional: Paste a second document here to check for contradictions."
                          />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIdentifyBlindSpots(!identifyBlindSpots)}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${identifyBlindSpots ? 'bg-rose-500 border-rose-500' : 'border-white/20'}`}>
                              {identifyBlindSpots && <X size={10} className="text-white" />}
                          </div>
                          <div className="flex flex-col">
                              <span className="text-xs text-gray-200 font-medium">Blind-Spot Identifier</span>
                              <span className="text-[9px] text-gray-400 uppercase">Detect critical missing information</span>
                          </div>
                      </div>
                  </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.xlsx,.pptx,.png,.jpg,.jpeg,.webp"
                id="file-upload"
              />

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 transition-all group"
                    title="Upload PDF, DOCX, TXT, XLSX, PPTX, or Images"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                  </button>
                  {!selectedFile && <span className="text-xs text-gray-500">{content.length} chars</span>}
                </div>
                
                <Button
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                  disabled={(!content.trim() && !selectedFile) || isAnalyzing}
                >
                  {selectedFile ? 'Process File' : 'Analyze'} <Play className="ml-2 w-3 h-3" />
                </Button>
              </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {result ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Executive Summary */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                Executive Summary
              </h3>
              <p className="text-gray-200 leading-relaxed">{result.summary}</p>
            </Card>

            <div className="grid grid-cols-1 gap-8">
              <AnalysisSection title="Key Points" items={result.keyPoints} color="secondary" />
              <AnalysisSection title="Action Items" items={result.actionItems} color="accent" />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 rotate-12">
              <FileText size={48} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to Analyze</h3>
            <p className="text-gray-400 max-w-xs">Paste your document text on the left to generate summary, insights, and action items.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
