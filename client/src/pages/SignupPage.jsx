import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Shield, Bike, Car, Mail, Lock, Smartphone, ArrowLeft, ArrowRight } from 'lucide-react';

const SignupPage = () => {
    const [role, setRole] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicleType: '',
        vehicleNumber: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/signup', { ...formData, role });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.user.role);
            localStorage.setItem('userId', res.data.user.id);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.msg || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-body">
            {/* Header Section */}
            <div className="pt-12 px-8 mb-8 animate-slide-down">
                <Link to="/login" className="w-10 h-10 bg-grayBg rounded-xl flex items-center justify-center text-black mb-6 hover:bg-black hover:text-white transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="font-heading text-4xl tracking-tighter text-black mb-2">Create <span className="text-orange">Account</span></h1>
                <p className="text-[#888] font-bold text-sm">Join the elite network of EasyFindRide</p>
            </div>

            <div className="flex-1 px-8 pb-12 overflow-y-auto custom-scrollbar">
                {/* ROLE SELECTION */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setRole('customer')}
                        className={`flex-1 p-5 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${role === 'customer' ? 'border-orange bg-orange shadow-[0_15px_30px_rgba(255,95,0,0.15)] text-white' : 'border-black/5 bg-grayBg text-[#888]'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'customer' ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            <User size={24} />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest">Customer</span>
                    </button>
                    <button 
                        onClick={() => setRole('driver')}
                        className={`flex-1 p-5 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${role === 'driver' ? 'border-black bg-black shadow-[0_15px_30px_rgba(0,0,0,0.15)] text-white' : 'border-black/5 bg-grayBg text-[#888]'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'driver' ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            <Shield size={24} />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest">Driver</span>
                    </button>
                </div>

                <form onSubmit={handleSignup} className="space-y-5 animate-fade-in">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                <User size={20} />
                            </div>
                            <input 
                                name="name"
                                type="text" 
                                className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                <Mail size={20} />
                            </div>
                            <input 
                                name="email"
                                type="email" 
                                className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative group flex gap-3">
                            <div className="bg-grayBg border border-transparent rounded-[24px] px-5 py-5 font-bold text-black/40 flex items-center justify-center">+91</div>
                            <div className="flex-1 relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                    <Smartphone size={20} />
                                </div>
                                <input 
                                    name="phone"
                                    type="tel" 
                                    className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {role === 'driver' && (
                        <div className="space-y-5 animate-slide-up">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Vehicle Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Bike', 'Auto', 'Car'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, vehicleType: type })}
                                            className={`py-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.vehicleType === type ? 'border-orange bg-orange/5 text-orange' : 'border-transparent bg-grayBg text-[#888]'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Vehicle Number</label>
                                <input 
                                    name="vehicleNumber"
                                    type="text" 
                                    className="w-full px-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black uppercase"
                                    placeholder="e.g. AP 37 BP 7203"
                                    value={formData.vehicleNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Secure Password</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors">
                                <Lock size={20} />
                            </div>
                            <input 
                                name="password"
                                type="password" 
                                className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white font-heading text-2xl py-5 rounded-[24px] shadow-2xl transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-3 ${role === 'customer' ? 'bg-orange hover:bg-orange-dark shadow-orange/20' : 'bg-black hover:bg-zinc-800 shadow-black/20'}`}
                    >
                        {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[#888] font-bold text-sm">
                        Already have an account? <Link to="/login" className="text-orange hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
