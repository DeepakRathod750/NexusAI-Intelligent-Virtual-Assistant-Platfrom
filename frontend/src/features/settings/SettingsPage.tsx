import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Moon,
    Sun,
    Shield,
    Save,
    CheckCircle2,
    Loader2,
    History,
    Sparkles,
    Trash2,
    Palette,
    Globe,
    Lock
} from 'lucide-react';
import { api } from '../../services/apiClient';

const SettingsPage: React.FC = () => {
    console.log("SettingsPage component mounting/rendering");
    const { 
        user, 
        theme, 
        setTheme, 
        saveSettings, 
        isLoadingSettings
    } = useStore();

    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'activity' | 'security'>('profile');
    const [displayName, setDisplayName] = useState(user?.full_name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.full_name || '');
        }

        const fetchRecentActivity = async () => {
            try {
                const response = await api.get<any>('/api/sessions?limit=5');
                if (response.data) setSessions(response.data);
            } catch (err) {
                console.error("Failed to fetch activity", err);
            }
        };

        if (activeTab === 'activity') {
            fetchRecentActivity();
        }
    }, [user, activeTab]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings({
                theme,
                full_name: displayName
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: UserIcon },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'activity', label: 'Activity Log', icon: History },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                        <p className="text-muted mt-1">Manage your NexusAI preferences and configurations.</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 size={18} className="animate-spin mr-2" />
                        ) : saveSuccess ? (
                            <CheckCircle2 size={18} className="mr-2" />
                        ) : (
                            <Save size={18} className="mr-2" />
                        )}
                        {saveSuccess ? 'Saved' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="col-span-1 space-y-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center p-4 rounded-xl transition-all border ${isActive
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                        : 'text-muted border-transparent hover:bg-white/5 hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon size={20} className="mr-3" />
                                    <span className="font-semibold text-sm">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Settings Content area */}
                    <div className="col-span-1 md:col-span-3">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl"
                        >

                            {/* PROFILE TAB */}
                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Profile Information</h2>
                                        <p className="text-sm text-muted">Update your public identity and contact info</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20 transition-all group-hover:scale-105">
                                                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                                                    <UserIcon size={40} />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-surface shadow-lg" title="Online" />
                                        </div>
                                        <div className="flex-1 space-y-2 text-center sm:text-left">
                                            <h3 className="text-lg font-semibold text-foreground">{user?.full_name || 'Nexus User'}</h3>
                                            <p className="text-sm text-muted">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted">Display Name</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-background/50 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted">Email Address</label>
                                            <input
                                                type="email"
                                                readOnly
                                                value={user?.email || 'user@nexusai.enterprise'}
                                                className="w-full bg-background/20 border border-border rounded-xl p-3 text-muted cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* APPEARANCE TAB */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Appearance</h2>
                                        <p className="text-sm text-muted">Customize the look and feel of your NexusAI</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-muted flex items-center">
                                            <Moon size={16} className="mr-2" /> Theme Preference
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`p-6 rounded-2xl border flex flex-col items-center justify-center space-y-3 transition-all ${theme === 'dark' ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-background border-border text-muted hover:bg-white/5 hover:text-foreground'
                                                    }`}
                                            >
                                                <Moon size={28} />
                                                <span className="font-semibold text-sm">Dark Mode</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`p-6 rounded-2xl border flex flex-col items-center justify-center space-y-3 transition-all ${theme === 'light' ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-background border-border text-muted hover:bg-white/5 hover:text-foreground'
                                                    }`}
                                            >
                                                <Sun size={28} />
                                                <span className="font-semibold text-sm">Light Mode</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-6">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground flex items-center">
                                                <Palette size={16} className="mr-2 text-primary" />
                                                Theme Customization
                                            </h3>
                                            <p className="text-[11px] text-muted mt-1">Personalize your workspace with custom brand colors</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-muted">Brand Accent Color</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {[
                                                        { name: 'Nexus Violet', color: '#8B5CF6' },
                                                        { name: 'Ocean Blue', color: '#3B82F6' },
                                                        { name: 'Emerald', color: '#10B981' },
                                                        { name: 'Sunrise', color: '#F59E0B' },
                                                        { name: 'Rose', color: '#EF4444' }
                                                    ].map((c) => (
                                                        <button
                                                            key={c.name}
                                                            onClick={() => {
                                                                document.documentElement.style.setProperty('--primary', c.color);
                                                                document.documentElement.style.setProperty('--primary-hover', `${c.color}dd`);
                                                            }}
                                                            className="w-8 h-8 rounded-full border-2 border-white/10 hover:scale-110 transition-transform shadow-lg"
                                                            style={{ backgroundColor: c.color }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            </div>
                                    </div>
                                </div>
                            )}

                            {/* ACTIVITY LOG TAB */}
                            {activeTab === 'activity' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h2 className="text-xl font-semibold text-foreground">Activity Log</h2>
                                            <p className="text-sm text-muted">Review and manage your recent AI interactions</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if(confirm('Are you sure you want to clear all activity history?')) {
                                                    try {
                                                        await api.delete('/api/sessions');
                                                        setSessions([]);
                                                    } catch (err) { console.error(err); }
                                                }
                                            }}
                                            className="p-2 text-muted hover:text-red-400 transition-colors"
                                            title="Clear All"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Shield size={18} className="text-primary" />
                                            <div>
                                                <h4 className="text-sm font-medium text-foreground">Session Auto-Retention</h4>
                                                <p className="text-xs text-muted">Automatically keep only the most recent sessions</p>
                                            </div>
                                        </div>
                                        <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-primary/50">
                                            <option>Last 10 sessions</option>
                                            <option>Last 20 sessions</option>
                                            <option>Last 50 sessions</option>
                                            <option>Keep everything</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <h3 className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Recent Items</h3>
                                        {sessions.length > 0 ? sessions.map((s, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-background/40 border border-border rounded-xl hover:bg-white/5 transition-all group">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Sparkles size={18} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-foreground">{s.title}</h4>
                                                        <p className="text-[10px] text-muted uppercase tracking-wider">{s.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted font-medium">{new Date(s.updatedAt).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-muted opacity-60">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <History className="text-gray-600" size={24} />
                                                </div>
                                                <p className="text-muted text-sm">No recent activity detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* SECURITY TAB */}
                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Security & Privacy</h2>
                                        <p className="text-sm text-muted">Manage your data security and account privacy</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center">
                                            <Lock size={16} className="mr-2 text-primary" /> Authentication
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
                                                <div>
                                                    <h4 className="text-sm font-medium text-foreground">Two-Factor Authentication</h4>
                                                    <p className="text-xs text-muted">
                                                        {twoFactorEnabled ? 'Securely enabled for your account' : 'Currently disabled for your account'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                        twoFactorEnabled 
                                                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                                                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                    }`}
                                                >
                                                    {twoFactorEnabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center text-red-400">
                                            <Trash2 size={16} className="mr-2" /> Danger Zone
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-red-400/5 border border-red-400/10 rounded-xl">
                                                <div>
                                                    <h4 className="text-sm font-medium text-foreground">Export All Data</h4>
                                                    <p className="text-xs text-muted">Download all your chat history and tasks</p>
                                                </div>
                                                <button 
                                                    onClick={() => alert('Exporting data... you will receive an email shortly.')}
                                                    className="px-4 py-1.5 bg-white/5 text-foreground text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors"
                                                >
                                                    Export
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-red-400/5 border border-red-400/10 rounded-xl">
                                                <div>
                                                    <h4 className="text-sm font-medium text-red-400">Delete Account</h4>
                                                    <p className="text-xs text-muted">Permanently erase your account and data</p>
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        if(confirm('Are you absolutely sure? This action cannot be undone and all your data will be permanently erased.')) {
                                                            try {
                                                                await api.delete('/api/auth/profile');
                                                                localStorage.removeItem('nexus_access_token');
                                                                window.location.href = '/';
                                                            } catch (err) {
                                                                console.error('Failed to delete account', err);
                                                                alert('Error deleting account. Please try again.');
                                                            }
                                                        }
                                                    }}
                                                    className="px-4 py-1.5 bg-red-400/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-400/20 transition-colors"
                                                >
                                                    Terminate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
