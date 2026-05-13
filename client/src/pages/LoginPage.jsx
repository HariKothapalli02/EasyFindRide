import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.user.role);
            localStorage.setItem('userId', res.data.user.id);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.msg || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6 bg-white animate-fade-in">
            <div className="mt-12 mb-10">
                <div className="font-heading text-4xl mb-2">Login / <span className="text-orange">Sign In</span></div>
                <p className="text-[#888] font-bold">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Email Address</label>
                    <input 
                        type="email" 
                        className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Password</label>
                    <input 
                        type="password" 
                        className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-orange text-white font-heading text-2xl py-5 rounded-2xl shadow-orange hover:bg-orange-dark active:scale-95 transition-all mt-6"
                >
                    Sign In
                </button>
            </form>

            <div className="mt-auto mb-8 text-center">
                <p className="text-[#888] font-bold text-sm">
                    Don't have an account? <Link to="/signup" className="text-orange">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
