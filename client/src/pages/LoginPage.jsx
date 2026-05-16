import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github as GitHubIcon } from 'lucide-react';
import api from '../utils/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.user.role);
            localStorage.setItem('userId', res.data.user.id);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.msg || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-body">
            {/* Top Branding Section */}
            <div className="h-[35vh] bg-black rounded-b-[60px] relative overflow-hidden flex flex-col items-center justify-center text-white px-8">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange rounded-full blur-[120px]" />
                </div>
                
                <div className="relative z-10 text-center animate-slide-down">
                    <div className="w-20 h-20 bg-orange rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_rgba(255,95,0,0.3)]">
                        <ArrowRight size={40} className="text-white -rotate-45" />
                    </div>
                    <h1 className="font-heading text-5xl tracking-tighter mb-2">EASYFIND<span className="text-orange">RIDE</span></h1>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[4px]">Elite Transport Solutions</p>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 px-8 -mt-12 relative z-20">
                <div className="bg-white rounded-[40px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-black/5 animate-fade-in">
                    <div className="mb-8">
                        <h2 className="font-heading text-3xl text-black">Welcome <span className="text-orange">Back</span></h2>
                        <p className="text-[#888] font-bold text-sm">Please enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input 
                                    type="email" 
                                    className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-[#888] uppercase tracking-widest">Password</label>
                                <button type="button" className="text-[10px] font-black text-orange uppercase tracking-widest hover:underline">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input 
                                    type="password" 
                                    className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white font-heading text-2xl py-5 rounded-[24px] shadow-2xl hover:bg-orange transition-all active:scale-[0.98] mt-4 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? 'SIGNING IN...' : 'SIGN IN'}
                                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-black/5" />
                        <span className="text-[10px] font-black text-[#ccc] uppercase tracking-widest">or continue with</span>
                        <div className="flex-1 h-[1px] bg-black/5" />
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button className="flex-1 py-4 bg-grayBg rounded-2xl flex items-center justify-center gap-2 hover:bg-black/5 transition-all active:scale-95">
                            <GitHubIcon size={20} />
                            <span className="font-bold text-sm">GitHub</span>
                        </button>
                        <button className="flex-1 py-4 bg-grayBg rounded-2xl flex items-center justify-center gap-2 hover:bg-black/5 transition-all active:scale-95">
                            <div className="w-5 h-5 bg-orange rounded-full flex items-center justify-center text-white text-[10px]">G</div>
                            <span className="font-bold text-sm">Google</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="py-10 text-center animate-fade-in">
                <p className="text-[#888] font-bold text-sm">
                    Don't have an account? <Link to="/signup" className="text-orange hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
