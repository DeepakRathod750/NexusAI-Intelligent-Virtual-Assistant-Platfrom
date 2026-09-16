import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Briefcase, 
    Sparkles, 
    Copy, 
    Download, 
    RefreshCw,
    UserCircle,
    Plus,
    History as HistoryIcon,
    Bookmark,
    CheckCircle2,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Github
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { useSession } from '../../hooks/useSession';
import { SessionSidebar } from '../../components/shared/SessionSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResumeGenerator: React.FC = () => {
    const {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        saveSession,
        createNewSession,
        setIsProcessing
    } = useSession('resume', { 
        input: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
            portfolio: '',
            education: '',
            skills: '',
            experience: '',
            projects: '',
            achievements: ''
        }, 
        output: '' 
    });

    const navigate = useNavigate();

    // Sync local state
    const formData = sessionContent.input || {};
    const result = sessionContent.output || '';

    const updateField = (field: string, value: string) => {
        setSessionContent({
            ...sessionContent,
            input: { ...formData, [field]: value }
        });
    };

    const isFormValid = () => {
        const required = ['fullName', 'email', 'phone', 'location', 'linkedin', 'github', 'education', 'skills', 'experience', 'projects'];
        return required.every(field => formData[field as keyof typeof formData]?.trim() !== '');
    };


    const handleGenerate = async () => {
        if (!isFormValid() || isProcessing) {
            alert('Please fill proper details first (including LinkedIn and GitHub).');
            return;
        }

        setIsProcessing(true);
        try {
            const textToAnalyze = `
                NAME: ${formData.fullName}
                CONTACT: Email: ${formData.email}, Phone: ${formData.phone}, Location: ${formData.location}
                LINKS: LinkedIn: ${formData.linkedin}, GitHub: ${formData.github}, Portfolio: ${formData.portfolio}
                EDUCATION: ${formData.education}
                SKILLS: ${formData.skills}
                EXPERIENCE: ${formData.experience}
                PROJECTS: ${formData.projects}
                ACHIEVEMENTS: ${formData.achievements}
            `.trim();

            const response = await api.post<any>('/api/write', {
                type: 'resume',
                text: textToAnalyze,
                sessionId: activeSessionId
            });
            
            const resultData = response.data;
            
            const newContent = {
                input: formData,
                output: resultData.result || ''
            };

            await saveSession(newContent, `Resume: ${formData.fullName || 'Untitled'}`);

            if (resultData.result) {
                setSessionContent({ ...sessionContent, output: resultData.result });
            }
        } catch (error: any) {
            console.error('Resume Generator Error:', error);
            alert('Failed to generate resume. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        const printContent = document.querySelector('.resume-print-area');
        const styleContent = document.querySelector('#resume-dynamic-styles');
        
        if (!printContent) {
            window.print();
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to download the PDF.');
            return;
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Resume - ${formData.fullName || 'Generated'}</title>
    <style>
        @page { size: portrait; margin: 15mm; }
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            color: #000; 
            background: white;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        ${styleContent ? styleContent.innerHTML : ''}
        
        /* Ensure elements don't constrain printing */
        .resume-print-area { max-width: 100%; width: 100%; }
        /* Clean up any UI styling remaining */
        .resume-document-style { padding: 0 !important; border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
    </style>
</head>
<body>
    <div class="resume-document-style">
        <div class="resume-print-area-wrapper">
            <div class="resume-print-area">
                ${printContent.innerHTML}
            </div>
        </div>
    </div>
    <script>
        window.onload = () => {
            setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 100);
            }, 500);
        };
    </script>
</body>
</html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
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
                        <Briefcase size={16} className="text-rose-400" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-rose-400">Professional Suite</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight uppercase">AI Resume Builder</h1>
                    <p className="text-gray-400">Generate high-impact, ATS-friendly resumes with neural optimization.</p>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={createNewSession}
                    className="text-xs gap-2 border border-white/10"
                >
                    <Plus size={14} /> New Resume
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar - Recent Resumes */}
                <div className="lg:col-span-3 hidden lg:block">
                    <SessionSidebar 
                        title="Recent Resumes"
                        sessions={recentSessions}
                        activeSessionId={activeSessionId}
                        onSessionSelect={(id) => navigate(`?session=${id}`)}
                        onNewSession={createNewSession}
                    />
                </div>

                {/* Main Form */}
                <Card className="p-8 lg:col-span-4 space-y-8 border-white/5 bg-[#141417]/50 backdrop-blur-3xl overflow-y-auto max-h-[800px] custom-scrollbar">
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                <UserCircle size={14} /> Personal Details
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <Input label="Full Name *" value={formData.fullName} onChange={(v) => updateField('fullName', v)} placeholder="John Doe" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Email *" value={formData.email} onChange={(v) => updateField('email', v)} placeholder="john@example.com" />
                                    <Input label="Phone *" value={formData.phone} onChange={(v) => updateField('phone', v)} placeholder="+1 234 567 890" />
                                </div>
                                <Input label="Location *" value={formData.location} onChange={(v) => updateField('location', v)} placeholder="City, Country" />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} /> Professional Links *
                            </h4>
                            <div className="space-y-4">
                                <Input label="LinkedIn *" value={formData.linkedin} onChange={(v) => updateField('linkedin', v)} placeholder="linkedin.com/in/username" />
                                <Input label="GitHub *" value={formData.github} onChange={(v) => updateField('github', v)} placeholder="github.com/username" />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={14} /> Professional Info
                            </h4>
                            <Textarea label="Education *" value={formData.education} onChange={(v) => updateField('education', v)} placeholder="Degree, College, Year" />
                            <Textarea label="Skills *" value={formData.skills} onChange={(v) => updateField('skills', v)} placeholder="React, Node.js, AWS, System Design..." />
                            <Textarea label="Experience *" value={formData.experience} onChange={(v) => updateField('experience', v)} placeholder="List your jobs, internships, and roles..." />
                            <Textarea label="Projects *" value={formData.projects} onChange={(v) => updateField('projects', v)} placeholder="Title, Tech Stack, Impact..." />
                            <Textarea label="Achievements" value={formData.achievements} onChange={(v) => updateField('achievements', v)} placeholder="Certifications, awards, honors..." />
                        </section>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        disabled={isProcessing}
                        className="w-full gap-2 py-6 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg shadow-rose-600/20 sticky bottom-0 z-10"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {result ? 'Refine Resume' : 'Generate Professional Resume'}
                    </Button>
                </Card>

                {/* Result Display */}
                <div className="lg:col-span-5">
                    <Card className="h-full min-h-[600px] flex flex-col border-white/5 bg-[#141417]/50 backdrop-blur-3xl overflow-hidden relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center text-center p-8">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-2 border-rose-500/20 rounded-full" />
                                        <div className="absolute top-0 w-16 h-16 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Architecting Career...</h3>
                                        <p className="text-sm text-gray-400">Optimizing for ATS and professional impact</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Generated Resume Content</span>
                            {result && (
                                <div className="flex gap-2">
                                    <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-all shadow-sm border border-primary/20 group/dl" title="Download as PDF">
                                        <Download size={14} className="group-hover/dl:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Download PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto shadow-inner">
                            {result ? (
                                <div className="resume-document-style bg-white p-12 text-black shadow-lg mx-auto max-w-[800px] min-h-full font-serif border border-gray-100">
                                    <style id="resume-dynamic-styles">{`
                                        .resume-document-style {
                                            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                                            color: #000 !important;
                                            line-height: 1.5;
                                            padding: 0.75in !important;
                                            background: white !important;
                                        }
                                        /* Centered Header Section */
                                        .resume-header {
                                            text-align: center !important;
                                            margin-bottom: 24pt !important;
                                        }
                                        .resume-header h1 {
                                            font-size: 28pt !important;
                                            font-weight: 800 !important;
                                            text-transform: uppercase !important;
                                            letter-spacing: -0.02em !important;
                                            margin-bottom: 4pt !important;
                                            color: #111 !important;
                                        }
                                        .resume-header .professional-title {
                                            font-size: 14pt !important;
                                            color: #444 !important;
                                            font-weight: 500 !important;
                                            margin-bottom: 12pt !important;
                                            text-transform: capitalize !important;
                                        }
                                        .resume-contact-row {
                                            display: flex !important;
                                            justify-content: center !important;
                                            align-items: center !important;
                                            flex-wrap: wrap !important;
                                            gap: 8pt 16pt !important;
                                            font-size: 9pt !important;
                                            color: #444 !important;
                                            margin-bottom: 2pt !important;
                                        }
                                        .resume-header-details {
                                            text-align: center !important;
                                            margin-bottom: 16pt !important;
                                        }
                                        .resume-contact-item {
                                            display: flex !important;
                                            align-items: center !important;
                                            gap: 4pt !important;
                                        }
                                        /* Section Headers */
                                        .resume-document-style h2 {
                                            font-size: 12pt !important;
                                            font-weight: 700 !important;
                                            text-transform: uppercase !important;
                                            letter-spacing: 0.1em !important;
                                            margin-top: 20pt !important;
                                            margin-bottom: 8pt !important;
                                            color: #111 !important;
                                            border-bottom: 1.5pt solid #111 !important;
                                            padding-bottom: 4pt !important;
                                        }
                                        /* Sub-headers (Job/Uni | Date) */
                                        .resume-h3-container {
                                            display: flex !important;
                                            justify-content: space-between !important;
                                            align-items: flex-start !important;
                                            flex-wrap: wrap !important;
                                            margin-top: 12pt !important;
                                            margin-bottom: 4pt !important;
                                            gap: 4pt 16pt !important;
                                        }
                                        .resume-h3-left {
                                            font-size: 10.5pt !important;
                                            font-weight: 600 !important;
                                            color: #222 !important;
                                        }
                                        .resume-h3-right {
                                            font-size: 10.5pt !important;
                                            font-weight: 400 !important;
                                            color: #666 !important;
                                        }
                                        .resume-document-style h3 {
                                            font-size: 10.5pt !important;
                                            font-weight: 600 !important;
                                            margin-top: 12pt !important;
                                            margin-bottom: 4pt !important;
                                            color: #222 !important;
                                        }
                                        .resume-document-style .sub-detail {
                                            font-weight: 400 !important;
                                            color: #666 !important;
                                        }
                                        /* General text */
                                        .resume-document-style p, .resume-document-style li {
                                            font-size: 10pt !important;
                                            color: #333 !important;
                                            line-height: 1.6 !important;
                                        }
                                        .resume-document-style p {
                                            margin-bottom: 8pt !important;
                                        }
                                        .resume-document-style ul {
                                            margin-left: 14pt !important;
                                            margin-top: 4pt !important;
                                            margin-bottom: 8pt !important;
                                            list-style-type: disc !important;
                                        }
                                        .resume-document-style li {
                                            margin-bottom: 3pt !important;
                                        }
                                        /* Skills Grid */
                                        .resume-document-style ul.skills-grid {
                                            display: grid !important;
                                            grid-template-columns: repeat(3, 1fr) !important;
                                            gap: 4pt 12pt !important;
                                            margin-top: 8pt !important;
                                            margin-bottom: 12pt !important;
                                            list-style: none !important;
                                            padding-left: 0 !important;
                                        }
                                        .resume-document-style ul.skills-grid li {
                                            list-style: none !important;
                                            margin-left: 0 !important;
                                            font-weight: 500 !important;
                                            margin-bottom: 2pt !important;
                                            display: flex !important;
                                            align-items: flex-start !important;
                                        }
                                        .resume-document-style ul.skills-grid li::before {
                                            content: "• " !important;
                                            color: #111 !important;
                                            font-weight: bold !important;
                                            margin-right: 6px !important;
                                        }
                                        @media print {
                                            /* Clean up layout if printed natively via Cmd+P instead of button */
                                            body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; }
                                            body * { visibility: hidden; }
                                            .resume-print-area-wrapper, .resume-print-area-wrapper * { visibility: visible; }
                                            .resume-print-area-wrapper { position: absolute; left: 0; top: 0; width: 100vw; padding: 0 !important; margin: 0 !important; }
                                            .resume-document-style { padding: 0 !important; border: none !important; box-shadow: none !important; }
                                            @page { size: portrait; margin: 15mm; }
                                        }
                                    `}</style>
                                    <div className="resume-print-area-wrapper">
                                        <div className="resume-print-area">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({node, children}) => (
                                                        <div className="resume-header">
                                                            <h1>{children}</h1>
                                                        </div>
                                                    ),
                                                    h2: ({node, ...props}) => <h2 {...props} />,
                                                    h3: ({node, children, ...props}) => {
                                                        const text = React.Children.toArray(children).join('');
                                                        if (text.includes('|')) {
                                                            const parts = text.split('|').map(p => p.trim());
                                                            if (parts.length === 2) {
                                                                return (
                                                                    <div className="resume-h3-container">
                                                                        <span className="resume-h3-left">{parts[0]}</span>
                                                                        <span className="resume-h3-right">{parts[1]}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div className="resume-h3-container">
                                                                    <span className="resume-h3-left">
                                                                        {parts[0]} <span className="sub-detail">{parts[1] ? `| ${parts[1]}` : ''}</span>
                                                                    </span>
                                                                    <span className="resume-h3-right">{parts[parts.length - 1]}</span>
                                                                </div>
                                                            );
                                                        }
                                                        return <h3 {...props}>{children}</h3>;
                                                    },
                                                    p: ({node, children, ...props}) => {
                                                        const getRawText = (nodes: any): string => {
                                                            return React.Children.toArray(nodes)
                                                                .map(child => {
                                                                    if (typeof child === 'string') return child;
                                                                    if (typeof child === 'object' && (child as any).props?.children) return getRawText((child as any).props.children);
                                                                    return '';
                                                                }).join('');
                                                        };

                                                        const content = getRawText(children);
                                                        if (node.position?.start.line === 2) return <div className="professional-title">{children}</div>;

                                                        const isContactLine = content.includes('|') && (content.includes('@') || (content.match(/\|/g) || []).length >= 2);
                                                        if (isContactLine) {
                                                            const parts = content.split('|').map(p => p.trim());
                                                            return (
                                                                <div className="resume-header-details">
                                                                    {/* Line 1: Email */}
                                                                    {parts[0] && <div className="resume-contact-row"><Mail size={10} className="inline mr-1" /> {parts[0]}</div>}
                                                                    {/* Line 2: Phone + Location */}
                                                                    {(parts[1] || parts[2]) && (
                                                                        <div className="resume-contact-row">
                                                                            {parts[1] && <span className="mr-4"><Phone size={10} className="inline mr-1" /> {parts[1]}</span>}
                                                                            {parts[2] && <span><MapPin size={10} className="inline mr-1" /> {parts[2]}</span>}
                                                                        </div>
                                                                    )}
                                                                    {/* Line 3: Links */}
                                                                    {(parts[3] || parts[4]) && (
                                                                        <div className="resume-contact-row text-[8pt] uppercase tracking-wider text-gray-500">
                                                                            {parts[3] && <span className="mr-4"><Linkedin size={10} className="inline mr-1" /> {parts[3].replace(/https?:\/\/(www\.)?/, '')}</span>}
                                                                            {parts[4] && <span><Github size={10} className="inline mr-1" /> {parts[4].replace(/https?:\/\/(www\.)?/, '')}</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return <p {...props}>{children}</p>;
                                                    },
                                                    ul: ({node, children}) => {
                                                        const isSkills = node.position?.start.line && node.position.start.line > 20;
                                                        return <ul className={isSkills ? "skills-grid" : "standard-list"}>{children}</ul>;
                                                    }
                                                }}
                                            >
                                                {result.replace(/^[\s\S]*?(?=#)/, '').trim() || result}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-12">
                                    <Briefcase size={64} className="mb-6 text-white" />
                                    <p className="text-lg font-medium max-w-[250px] text-white">Your professionally generated resume will appear here.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Input = ({ label, value, onChange, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-rose-500/50 transition-all placeholder:text-gray-700"
        />
    </div>
);

const Textarea = ({ label, value, onChange, placeholder }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-rose-500/50 transition-all resize-none min-h-[100px] font-light placeholder:text-gray-700"
        />
    </div>
);

export default ResumeGenerator;
