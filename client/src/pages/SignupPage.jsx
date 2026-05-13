import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Shield, Bike, Car } from 'lucide-react';

const SignupPage = () => {
    const [role, setRole] = useState('customer');
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
        try {
            const res = await api.post('/auth/signup', { ...formData, role });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.user.role);
            localStorage.setItem('userId', res.data.user.id);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.msg || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6 bg-white overflow-y-auto animate-fade-in">
            <div className="mt-8 mb-8">
                <div className="font-heading text-4xl mb-2">Create <span className="text-orange">Account</span></div>
                <p className="text-[#888] font-bold">Sign up to get started with EasyFindRide.</p>
            </div>

            {/* ROLE SELECTION */}
            <div className="flex gap-4 mb-8">
                <button 
                    onClick={() => setRole('customer')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'customer' ? 'border-orange bg-orange/5 text-orange' : 'border-black/5 text-[#888]'}`}
                >
                    <User size={24} />
                    <span className="font-black text-xs uppercase">Customer</span>
                </button>
                <button 
                    onClick={() => setRole('driver')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'driver' ? 'border-orange bg-orange/5 text-orange' : 'border-black/5 text-[#888]'}`}
                >
                    <Shield size={24} />
                    <span className="font-black text-xs uppercase">Driver</span>
                </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Full Name</label>
                    <input 
                        name="name"
                        type="text" 
                        className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Email Address</label>
                    <input 
                        name="email"
                        type="email" 
                        className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Mobile Number</label>
                    <div className="flex gap-2">
                        <div className="bg-grayBg border border-black/5 rounded-2xl px-4 py-4 font-bold text-black/40">+91</div>
                        <input 
                            name="phone"
                            type="tel" 
                            className="flex-1 px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {role === 'driver' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm font-black mb-1.5 ml-1">Vehicle Type</label>
                            <select 
                                name="vehicleType"
                                className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold appearance-none"
                                value={formData.vehicleType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Vehicle</option>
                                <option value="Bike">Bike</option>
                                <option value="Auto">Auto</option>
                                <option value="Car">Car</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-black mb-1.5 ml-1">Vehicle Number</label>
                            <input 
                                name="vehicleNumber"
                                type="text" 
                                className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                                placeholder="TS 09 AB 1234"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-black mb-1.5 ml-1">Password</label>
                    <input 
                        name="password"
                        type="password" 
                        className="w-full px-5 py-4 bg-grayBg border border-black/5 rounded-2xl outline-none focus:border-orange transition-all font-bold"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-orange text-white font-heading text-2xl py-5 rounded-2xl shadow-orange hover:bg-orange-dark active:scale-95 transition-all mt-6"
                >
                    Create Account
                </button>
            </form>

            <div className="mt-8 mb-8 text-center">
                <p className="text-[#888] font-bold text-sm">
                    Already have an account? <Link to="/login" className="text-orange">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
