import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sessionService, Session } from '../services/sessionService';

export const useSession = (type: Session['type'], initialContent: any = {}) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionContent, setSessionContent] = useState<any>(initialContent);
    const [sessionTitle, setSessionTitle] = useState<string>('');

    const fetchRecent = useCallback(async () => {
        try {
            const sessions = await sessionService.getSessions(type);
            setRecentSessions(sessions);
        } catch (error) {
            console.error(`Failed to fetch recent ${type} sessions:`, error);
        }
    }, [type]);

    const loadSession = useCallback(async (id: string) => {
        setIsProcessing(true);
        try {
            const session = await sessionService.getSessionById(id);
            if (session && session.type === type) {
                setSessionContent(session.content);
                setSessionTitle(session.title);
                setActiveSessionId(id);
                return session;
            }
        } catch (error) {
            console.error(`Failed to load ${type} session:`, error);
        } finally {
            setIsProcessing(false);
        }
    }, [type]);

    const saveSession = useCallback(async (content: any, title?: string, metadata: any = {}) => {
        setIsProcessing(true);
        try {
            if (activeSessionId) {
                const updated = await sessionService.updateSession(activeSessionId, { content, title });
                setRecentSessions(prev => prev.map(s => s._id === activeSessionId ? updated : s));
                return updated;
            } else {
                const created = await sessionService.createSession({
                    type,
                    title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Session ${new Date().toLocaleDateString()}`,
                    content,
                    metadata
                });
                setActiveSessionId(created._id);
                setRecentSessions(prev => [created, ...prev]);
                navigate(`?session=${created._id}`, { replace: true });
                return created;
            }
        } catch (error) {
            console.error(`Failed to save ${type} session:`, error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [activeSessionId, type, navigate]);

    const createNewSession = useCallback(() => {
        setActiveSessionId(null);
        setSessionContent(initialContent);
        setSessionTitle('');
        navigate(`/${type}-assistant`, { replace: true });
    }, [type, navigate, initialContent]);

    // Handle URL param loading
    useEffect(() => {
        const sessionId = searchParams.get('session');
        if (sessionId && sessionId !== activeSessionId) {
            loadSession(sessionId);
        }
    }, [searchParams, activeSessionId, loadSession]);

    // Initial fetch
    useEffect(() => {
        fetchRecent();
    }, [fetchRecent]);

    return {
        activeSessionId,
        recentSessions,
        isProcessing,
        sessionContent,
        setSessionContent,
        sessionTitle,
        setSessionTitle,
        fetchRecent,
        loadSession,
        saveSession,
        createNewSession,
        setIsProcessing
    };
};
