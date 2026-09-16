import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AuthPage from './AuthPage';

interface SessionManagerProps {
    children: React.ReactNode;
}

/**
 * SessionManager Component
 * 
 * Central coordinator for the application's authentication state.
 * Handles the transition from unauthenticated/loading to authenticated
 * and ensures the user profile is synced.
 */
const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
    const { 
        isAuthed, 
        user, 
        initializeAuth, 
        fetchSettings 
    } = useStore();

    // Start the auth listener on initial mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Fetch settings/profile once authenticated
    useEffect(() => {
        if (isAuthed && user) {
            fetchSettings();
        }
    }, [isAuthed, user, fetchSettings]);

    // 1. Initial State: Authentication check in progress
    if (isAuthed === null) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0c] z-50 overflow-hidden">
                <div className="relative flex flex-col items-center">
                    {/* Animated background glow */}
                    <div className="absolute -inset-24 bg-violet-600/20 blur-[100px] rounded-full animate-pulse" />
                    
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                            <Sparkles className="text-white w-10 h-10" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <h2 className="text-2xl font-bold text-white tracking-tight">Nexus AI</h2>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1 w-1 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1 w-1 rounded-full bg-violet-500 animate-bounce" />
                        </div>
                        <p className="mt-4 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">
                            Synchronizing Session
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated State: Redirect to Auth Page
    if (!isAuthed) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="auth-page"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                >
                    <AuthPage onAuthenticated={() => fetchSettings()} />
                </motion.div>
            </AnimatePresence>
        );
    }

    // 3. Authenticated State: Reveal App
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="app-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default SessionManager;
