import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppView } from './types';
import Shell from './components/layout/Shell';
import Dashboard from './features/dashboard/Dashboard';
import DocumentAnalyzer from './features/documents/DocumentAnalyzer';
import Brainstormer from './features/brainstormer/Brainstormer';
import KnowledgeBase from './features/knowledge/KnowledgeBase';
import ChatInterface from './features/chat/ChatInterface';
import GoalTracker from './features/goals/GoalTracker';
import FocusSession from './features/focus/FocusSession';
import WritingStudio from './features/writing/WritingStudio';
import EmailAssistant from './features/email/EmailAssistant';
import MeetingNotes from './features/meeting/MeetingNotes';
import ResumeGenerator from './features/resume/ResumeGenerator';

import SettingsPage from './features/settings/SettingsPage';
import AuthPage from './features/auth/AuthPage';
import { authService, ACCESS_TOKEN_KEY } from './services/authService';
import { api } from './services/apiClient';
import { useStore } from './store/useStore';

import SessionManager from './features/auth/SessionManager';

const App: React.FC = () => {
    const { theme } = useStore();

    useEffect(() => {
        // Apply theme to document root
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else {
            document.documentElement.classList.remove('light-theme');
        }
    }, [theme]);

    return (
        <BrowserRouter>
            <SessionManager>
                <Shell>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/chat" element={<ChatInterface />} />
                        <Route path="/doc-analyzer" element={<DocumentAnalyzer />} />
                        <Route path="/brainstormer" element={<Brainstormer />} />
                        <Route path="/writing-studio" element={<WritingStudio />} />
                        <Route path="/focus-session" element={<FocusSession />} />
                        <Route path="/knowledge" element={<KnowledgeBase />} />
                        <Route path="/goal-tracker" element={<GoalTracker />} />
                        <Route path="/email-assistant" element={<EmailAssistant />} />
                        <Route path="/meeting-notes" element={<MeetingNotes />} />
                        <Route path="/resume-generator" element={<ResumeGenerator />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        
                        {/* Redirect any unknown routes to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Shell>
            </SessionManager>
        </BrowserRouter>
    );
};

export default App;
