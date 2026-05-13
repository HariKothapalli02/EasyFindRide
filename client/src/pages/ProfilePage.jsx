import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { User, Mail, Phone, LogOut, ChevronRight, Settings, Shield, Bell } from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get('/auth/profile');
                setUser(res.data);
            } catch (err) {
                console.error(err);
                navigate('/login');
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!user) return <div className="p-10 text-center font-heading text-3xl">Loading...</div>;

    return (
        <div className="pb-32 min-h-screen bg-grayBg">
            <Navbar />
            
            <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm mb-6">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-orange rounded-3xl flex items-center justify-center text-white font-heading text-4xl shadow-xl shadow-orange/20 mb-4 relative">
                        {user.name.charAt(0)}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-xl flex items-center justify-center border-4 border-white">
                            <Settings size={14} color="white" />
                        </div>
                    </div>
                    <h2 className="font-heading text-3xl text-black">{user.name}</h2>
                    <p className="text-[#888] font-bold text-sm">Premium Member</p>
                </div>
            </div>

            <div className="px-5 space-y-6">
                {/* ACCOUNT INFO */}
                <div>
                    <div className="text-[10px] font-black text-[#888] uppercase tracking-[2px] mb-3 ml-2">Account Details</div>
                    <div className="bg-white rounded-[24px] overflow-hidden border border-black/5">
                        <div className="flex items-center gap-4 p-5 border-b border-black/5">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <User size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-black text-[#888] uppercase">Full Name</div>
                                <div className="font-bold text-black">{user.name}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-5 border-b border-black/5">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-black text-[#888] uppercase">Email Address</div>
                                <div className="font-bold text-black">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-5">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-black text-[#888] uppercase">Phone Number</div>
                                <div className="font-bold text-black">+91 {user.phone}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SETTINGS */}
                <div className="space-y-3">
                    {[
                        { icon: Bell, title: 'Notifications', color: 'bg-blue-500/10 text-blue-500' },
                        { icon: Shield, title: 'Security & Privacy', color: 'bg-green-500/10 text-green-500' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-black/5 active:scale-95 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                                    <item.icon size={20} />
                                </div>
                                <span className="font-black text-sm">{item.title}</span>
                            </div>
                            <ChevronRight size={18} className="text-[#bbb]" />
                        </div>
                    ))}
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 bg-black text-white py-5 rounded-2xl font-heading text-xl shadow-lg hover:bg-orange active:scale-95 transition-all"
                >
                    <LogOut size={20} />
                    Logout Account
                </button>
            </div>

            <BottomNav />
        </div>
    );
};

export default ProfilePage;
