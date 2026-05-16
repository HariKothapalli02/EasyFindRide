import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import BottomNav from '../components/BottomNav';
import { Wallet, TrendingUp, Calendar, Clock, ArrowUpRight, ArrowDownLeft, DollarSign, History } from 'lucide-react';

const WalletPage = () => {
    const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await api.get('/rides/earnings');
                setEarnings(res.data);
            } catch (err) {
                console.error('Error fetching earnings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    return (
        <div className="min-h-screen bg-grayBg font-body pb-32">
            {/* Header section */}
            <div className="bg-black text-white p-8 pt-12 rounded-b-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-orange/20 rounded-full blur-3xl" />
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Wallet size={24} className="text-orange" />
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange">Driver Partner</span>
                    </div>
                </div>

                <div className="relative z-10">
                    <h1 className="font-heading text-4xl mb-1">Total <span className="text-orange">Earnings</span></h1>
                    <p className="text-white/50 text-xs font-bold mb-8">Summary of your ride profits</p>
                    
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Available Balance</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-heading text-white">₹{earnings.month}</span>
                            <span className="text-orange font-black text-sm">INR</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-8 relative z-20">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[28px] shadow-lg shadow-black/5 border border-black/5 animate-slide-up">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                            <Clock size={20} />
                        </div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">Today</div>
                        <div className="font-heading text-2xl text-black">₹{earnings.today}</div>
                    </div>
                    <div className="bg-white p-5 rounded-[28px] shadow-lg shadow-black/5 border border-black/5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                            <Calendar size={20} />
                        </div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">This Week</div>
                        <div className="font-heading text-2xl text-black">₹{earnings.week}</div>
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-[32px] shadow-lg shadow-black/5 border border-black/5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="font-heading text-xl">Earnings <span className="text-orange">Stats</span></h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-grayBg rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-green-500 shadow-sm">
                                    <ArrowUpRight size={16} />
                                </div>
                                <span className="text-sm font-bold text-black">Completed Rides</span>
                            </div>
                            <span className="text-sm font-black text-black">Current Month</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-grayBg rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-orange shadow-sm">
                                    <History size={16} />
                                </div>
                                <span className="text-sm font-bold text-black">Last Payout</span>
                            </div>
                            <span className="text-sm font-black text-[#888]">Processing...</span>
                        </div>
                    </div>
                </div>

                <button className="w-full mt-8 bg-black text-white py-5 rounded-[28px] font-heading text-2xl shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                    Withdraw Earnings
                    <ArrowDownLeft size={20} className="text-orange" />
                </button>
            </div>

            <BottomNav />
        </div>
    );
};

export default WalletPage;
