import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { 
    Shield, 
    Lock, 
    User, 
    ChevronRight, 
    ArrowRight,
    Zap,
    Factory,
    Fingerprint,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await client.post('/auth/login', { username, password });
            const { token, user } = response.data;
            setAuth(token, user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication sequence failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] p-6 selection:bg-orange-100 selection:text-orange-900 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#e85c24]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f97316]/5 rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden relative z-10 border border-slate-100"
            >
                {/* Left Side: Visual/Branding */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-[#333333] text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#e85c24] to-[#333333]" />
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:32px_32px]" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                                <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter uppercase italic">ADHMANGALAM</span>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
                                Industrial <br />
                                <span className="text-[#e85c24] italic">Control</span> System
                            </h2>
                            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed">
                                Enter your credentials to access the central administration gateway.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center gap-4 p-5 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 group hover:bg-white/10 transition-all duration-500">
                            <div className="w-10 h-10 bg-[#e85c24]/20 rounded-xl flex items-center justify-center text-[#e85c24] group-hover:scale-110 transition-transform">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-[#e85c24]">Security Active</p>
                                <p className="text-sm font-bold text-slate-300">End-to-end encrypted protocol</p>
                            </div>
                        </div>
                        <div className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            System Build v2.4.0-Stable
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-12 lg:p-20 flex flex-col justify-center bg-white">
                    <div className="mb-12">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                            <span className="text-xl font-black tracking-tighter uppercase italic">ADHMANGALAM</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Command Access</h1>
                        <p className="text-slate-500 font-bold text-sm">PROVISIONING GATEWAY</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl border border-rose-100 flex items-center gap-3 shadow-sm"
                                >
                                    <Fingerprint size={18} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1 group-focus-within:text-[#e85c24] transition-colors">Credential Identification</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#e85c24] transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#e85c24]/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Admin Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1 group-focus-within:text-[#e85c24] transition-colors">Access Protocol</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#e85c24] transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-3xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#e85c24]/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Secure Cipher"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full group relative bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-slate-200"
                        >
                            <div className="absolute inset-0 bg-[#e85c24] translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-[0.16, 1, 0.3, 1]" />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Initiate Authentication
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Zap size={14} className="text-[#e85c24]" /> Authorized Personnel Only
                        </div>
                        <a href="#" className="text-[10px] font-black text-[#e85c24] uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">
                            Forgot Protocol?
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
