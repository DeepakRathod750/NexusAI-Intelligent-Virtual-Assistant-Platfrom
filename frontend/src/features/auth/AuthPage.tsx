import React, { useMemo, useState } from 'react';
import { auth } from '../../config/firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { useStore } from '../../store/useStore';

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

type AuthMode = 'login' | 'register';

interface AuthPageProps {
    onAuthenticated: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const { setUser } = useStore();

    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const heading = mode === 'login' ? 'Welcome Back' : 'Create Account';

    const submitLabel = mode === 'login' ? 'Sign In' : 'Create Account';

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (fullName) {
                    await firebaseUpdateProfile(userCredential.user, {
                        displayName: fullName
                    });
                }
            }
            // onAuthStateChanged in useStore will handle the transition
            onAuthenticated();
        } catch (err: any) {
            console.error('Firebase Auth Error:', err);
            let message = 'Authentication failed. Please try again.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = 'Invalid email or password.';
            } else if (err.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (err.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            onAuthenticated();
        } catch (err: any) {
            console.error('Google Login Error:', err);
            setError('Google sign-in failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-6 relative overflow-hidden">
             {/* Abstract Background Glows */}
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5046e5]/10 blur-[120px] rounded-full" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a855f7]/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md border border-white/10 rounded-[2.5rem] bg-[#141417]/40 backdrop-blur-3xl shadow-2xl p-10 relative z-10 transition-all duration-500">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{heading}</h1>
                    <p className="text-gray-400 font-medium">NexusAI • Enterprise Intelligence</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email address</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 py-4 text-white placeholder-gray-600 outline-none transition-all focus:border-[#5046e5]/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#5046e5]/10"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full name</label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 py-4 text-white placeholder-gray-600 outline-none transition-all focus:border-[#5046e5]/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#5046e5]/10"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 py-4 text-white placeholder-gray-600 outline-none transition-all focus:border-[#5046e5]/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-[#5046e5]/10"
                                placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl bg-[#5046e5] text-white font-bold text-lg hover:bg-[#5046e5]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#5046e5]/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        type="submit"
                    >
                        {isSubmitting ? 'Processing...' : submitLabel}
                    </button>
                </form>

                        <div className="mt-8 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#141417] px-2 text-gray-500 font-semibold tracking-wider">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white/[0.03] text-white text-sm font-bold border border-white/[0.05] hover:bg-white/[0.06] transition-all active:scale-[0.98] group"
                            >
                                <GoogleIcon className="w-5 h-5 opacity-90 group-hover:opacity-100 transition-opacity" />
                                Google account
                            </button>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-gray-500 text-sm font-medium">
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                        setError(null);
                                    }}
                                    className="text-[#5046e5] hover:text-[#5046e5]/80 font-bold ml-1 transition-colors"
                                >
                                    {mode === 'login' ? 'Register' : 'Login'}
                                </button>
                            </p>
                        </div>
            </div>
        </div>
    );
};

export default AuthPage;

