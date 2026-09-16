import { create } from 'zustand';
import { AppView } from '../types';
import { api } from '../services/apiClient';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

interface AppState {
    currentView: AppView;
    isSidebarOpen: boolean;
    theme: 'dark' | 'light';
    aiModel: string;
    notificationsEnabled: boolean;
    isLoadingSettings: boolean;
    user: any | null;
    isAuthed: boolean | null;
    setUser: (user: any) => void;
    logout: () => Promise<void>;
    initializeAuth: () => void;
    setCurrentView: (view: AppView) => void;
    toggleSidebar: () => void;
    setTheme: (theme: 'dark' | 'light') => void;
    setAiModel: (model: string) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    fetchSettings: () => Promise<void>;
    saveSettings: (settings: any) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    currentView: AppView.DASHBOARD,
    isSidebarOpen: true,
    theme: 'dark',
    aiModel: 'gpt-4o-mini',
    notificationsEnabled: true,
    isLoadingSettings: false,
    user: null,
    isAuthed: null,
    setUser: (user) => set({ user, isAuthed: !!user }),
    
    logout: async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('access-token');
            set({ user: null, isAuthed: false });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    initializeAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                try {
                    // 1. Get the ID Token and set baseline info
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('access-token', token);
                    
                    set({ 
                        user: { 
                            full_name: firebaseUser.displayName, 
                            email: firebaseUser.email,
                            avatar: firebaseUser.photoURL
                        }
                    });

                    // 2. Sync with backend to get full profile
                    const response = await api.get<any>('/api/auth/me');
                    if (response && response.data?.user) {
                        set({ user: response.data.user, isAuthed: true });
                        console.log('[AUTH] Session fully synchronized');
                    } else {
                        set({ isAuthed: true });
                    }
                } catch (error) {
                    console.error('Auth sync failed:', error);
                    set({ user: null, isAuthed: false });
                }
            } else {
                localStorage.removeItem('access-token');
                set({ user: null, isAuthed: false });
            }
        });
    },

    setCurrentView: (view) => set({ currentView: view }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setTheme: (theme) => set({ theme }),
    setAiModel: (aiModel) => set({ aiModel }),
    setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),

    fetchSettings: async () => {
        try {
            set({ isLoadingSettings: true });
            const response = await api.get<any>('/api/settings');
            if (response && response.data) {
                const s = response.data;
                set({
                    theme: s.theme || 'dark',
                    aiModel: s.ai_model || 'gpt-4o-mini',
                    notificationsEnabled: s.notifications ?? true
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            set({ isLoadingSettings: false });
        }
    },

    saveSettings: async (newSettings: { 
        theme?: string; 
        ai_model?: string; 
        notifications?: boolean;
        full_name?: string;
    }) => {
        const { theme, aiModel, notificationsEnabled, setUser } = get();
        
        const currentSettings = {
            theme: newSettings.theme ?? theme,
            ai_model: newSettings.ai_model ?? aiModel,
            notifications: newSettings.notifications ?? notificationsEnabled
        };

        try {
            // 1. Update Settings Model
            await api.put<any>('/api/settings', currentSettings);
            
            // 2. Update Profile (User Model) if full_name is provided
            if (newSettings.full_name !== undefined) {
                const profileResp = await api.put<any>('/api/auth/profile', { 
                    full_name: newSettings.full_name 
                });
                if (profileResp.data?.user) {
                    setUser(profileResp.data.user);
                }
            }

            set({
                theme: currentSettings.theme as 'light' | 'dark',
                aiModel: currentSettings.ai_model,
                notificationsEnabled: currentSettings.notifications
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },
}));
