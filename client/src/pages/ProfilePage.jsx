import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { 
    User, 
    Mail, 
    Phone, 
    LogOut, 
    ChevronRight, 
    Settings, 
    Shield, 
    Bell, 
    Wallet, 
    Award, 
    Users, 
    Copy, 
    ArrowUpRight, 
    ShieldAlert, 
    Trophy,
    Activity,
    CreditCard,
    Plus
} from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState({ balance: 0, pendingDues: 0, history: [] });
    const [loyalty, setLoyalty] = useState({ points: 0, totalEarned: 0, totalRedeemed: 0, tier: 'Bronze', history: [] });
    const [referral, setReferral] = useState({ code: '', fraudScore: 0, earnings: 0, referralsCount: 0, referrals: [] });
    
    const [referralInput, setReferralInput] = useState('');
    const [payDuesInput, setPayDuesInput] = useState('');
    const [isApplyingCode, setIsApplyingCode] = useState(false);
    const [isPayingDues, setIsPayingDues] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Parallel fetch to fetch profile, wallet, loyalty points, and referrals
            const [profileRes, walletRes, loyaltyRes, referralRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/wallet/balance'),
                api.get('/loyalty/points'),
                api.get('/referrals/info')
            ]);

            setUser(profileRes.data);
            setWallet(walletRes.data);
            setLoyalty(loyaltyRes.data);
            setReferral(referralRes.data);
        } catch (err) {
            console.error('Error fetching profile dashboard details:', err);
            if (err.response?.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleCopyCode = () => {
        if (!referral.code) return;
        navigator.clipboard.writeText(referral.code);
        alert(`Referral code "${referral.code}" copied to clipboard! Share it with friends to earn ₹50.`);
    };

    const handleApplyCode = async (e) => {
        e.preventDefault();
        if (!referralInput.trim()) return;
        setIsApplyingCode(true);
        try {
            const fingerprint = navigator.userAgent;
            const res = await api.post('/referrals/apply', { 
                code: referralInput.trim().toUpperCase(),
                deviceFingerprint: fingerprint
            });
            alert(res.data.msg);
            setReferralInput('');
            fetchAllData(); // Refresh metrics
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to apply referral code');
        } finally {
            setIsApplyingCode(false);
        }
    };

    const handlePayDues = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payDuesInput);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }
        setIsPayingDues(true);
        try {
            const res = await api.post('/wallet/pay-dues', { amount: amt });
            alert(res.data.msg);
            setPayDuesInput('');
            fetchAllData();
        } catch (err) {
            console.error(err);
            alert('Payment failed. Try again.');
        } finally {
            setIsPayingDues(false);
        }
    };

    const handleRedeem = async (pts) => {
        if (loyalty.points < pts) {
            alert('Insufficient loyalty points for redemption');
            return;
        }
        try {
            const res = await api.post('/loyalty/redeem', { points: pts });
            alert(res.data.msg);
            fetchAllData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Redemption failed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-grayBg flex items-center justify-center flex-col">
                <div className="w-12 h-12 border-4 border-orange/10 border-t-orange rounded-full animate-spin mb-4" />
                <div className="font-heading text-xl text-[#888]">Loading account details...</div>
            </div>
        );
    }

    if (!user) return null;

    const hasOutstandingDues = wallet.pendingDues > 0;
    const isUserFrozen = user.isFrozen;
    const fraudScore = user.customerFraudScore || 0;

    return (
        <div className="pb-32 min-h-screen bg-grayBg font-body">
            <Navbar />
            
            {/* Top User Profile Banner */}
            <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm mb-6 border-b border-black/5">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-orange rounded-3xl flex items-center justify-center text-white font-heading text-4xl shadow-xl shadow-orange/20 mb-4 relative">
                        {user.name.charAt(0).toUpperCase()}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black rounded-xl flex items-center justify-center border-4 border-white">
                            <Settings size={14} color="white" />
                        </div>
                    </div>
                    
                    <h2 className="font-heading text-3xl text-black leading-none mb-1.5 flex items-center gap-1.5 justify-center">
                        {user.name}
                        {loyalty.tier !== 'Bronze' && (
                            <Trophy size={18} className={
                                loyalty.tier === 'Platinum' ? 'text-purple-600' :
                                loyalty.tier === 'Gold' ? 'text-yellow-500' : 'text-slate-400'
                            } />
                        )}
                    </h2>
                    
                    {/* Tier badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        loyalty.tier === 'Platinum' ? 'bg-purple-600/10 text-purple-600 border border-purple-600/10' :
                        loyalty.tier === 'Gold' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/10' :
                        loyalty.tier === 'Silver' ? 'bg-slate-400/10 text-slate-500 border border-slate-400/10' :
                        'bg-orange/10 text-orange border border-orange/10'
                    }`}>
                        {loyalty.tier} Tier Member
                    </div>
                </div>
            </div>

            <div className="px-5 space-y-6 max-w-[500px] mx-auto w-full">
                {/* Account health notifications */}
                {isUserFrozen && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 text-red-600 flex gap-4 items-start animate-pulse">
                        <ShieldAlert size={24} className="shrink-0" />
                        <div>
                            <h4 className="font-heading text-lg leading-none mb-1">ACCOUNT RESTRICTED</h4>
                            <p className="text-xs font-bold leading-normal opacity-80">
                                Your account has been frozen due to suspicious activity. Payouts and bookings are blocked. Please contact support.
                            </p>
                        </div>
                    </div>
                )}

                {fraudScore >= 40 && !isUserFrozen && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-5 text-yellow-700 flex gap-4 items-start">
                        <ShieldAlert size={24} className="shrink-0" />
                        <div>
                            <h4 className="font-heading text-lg leading-none mb-1">ACCOUNT WARNING ALERT</h4>
                            <p className="text-xs font-bold leading-normal opacity-85">
                                High account activity risk score flagged ({fraudScore}%). Avoid repeated ride cancellations and farming to prevent permanent suspension.
                            </p>
                        </div>
                    </div>
                )}

                {/* 1. Wallet Balance & Dues Panel */}
                <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <Wallet size={20} />
                            </div>
                            <span className="font-heading text-lg text-black">My Ride Wallet</span>
                        </div>
                        {hasOutstandingDues && (
                            <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse border border-red-500/5">
                                Dues Pending
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Current Balance</div>
                            <div className={`text-3xl font-heading flex items-center gap-1 leading-none ${hasOutstandingDues ? 'text-red-500' : 'text-black'}`}>
                                <span>₹</span>
                                <span>{wallet.balance}</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Pending Dues</div>
                            <div className="text-3xl font-heading flex items-center gap-1 text-black/55 leading-none">
                                <span>₹</span>
                                <span>{wallet.pendingDues}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pay dues drawer if negative */}
                    {hasOutstandingDues && (
                        <form onSubmit={handlePayDues} className="mt-5 pt-5 border-t border-dashed border-black/5 space-y-3">
                            <div className="text-xs font-bold text-red-500 leading-normal mb-2 bg-red-500/5 p-3.5 rounded-2xl border border-red-500/5">
                                Account limit: Deductions up to -₹150 allowed. Please clear outstanding balance to continue ride booking.
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="number"
                                    placeholder="Enter payment..."
                                    value={payDuesInput}
                                    onChange={(e) => setPayDuesInput(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-grayBg border border-transparent rounded-xl outline-none focus:border-red-500/20 focus:bg-white font-bold text-xs text-black"
                                />
                                <button
                                    type="submit"
                                    disabled={isPayingDues}
                                    className="bg-black hover:bg-red-500 text-white font-heading text-xs uppercase tracking-widest px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isPayingDues ? 'PAYING...' : 'PAY DUES'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* 2. Loyalty Rewards Program Hub */}
                <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-5 border-b border-black/5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <Award size={20} />
                            </div>
                            <div>
                                <span className="font-heading text-lg text-black block leading-none mb-1">Loyalty Points Hub</span>
                                <span className="text-[9px] font-black text-[#aaa] uppercase tracking-wider">Earn points on every completed ride</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-heading text-2xl text-orange leading-none">{loyalty.points}</div>
                            <div className="text-[8px] font-black text-[#aaa] uppercase tracking-tighter mt-1">Available Points</div>
                        </div>
                    </div>

                    {/* Tier Progress description */}
                    <div className="bg-orange/5 border border-orange/10 rounded-2xl p-4 mb-6 flex justify-between items-center text-xs font-bold">
                        <div>
                            <span className="text-[#888]">Lifetime Earned Points:</span>
                            <span className="text-black ml-1 font-black">{loyalty.totalEarned}</span>
                        </div>
                        <div className="flex items-center gap-1 text-orange font-black uppercase text-[10px]">
                            <TrendingUp size={12} />
                            {loyalty.tier} Benefits
                        </div>
                    </div>

                    {/* Redemption Coupon options */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1 mb-2">Redeem Points for Wallet Cash</div>
                        {[
                            { pts: 50, cash: 25, label: 'Standard Discount' },
                            { pts: 100, cash: 60, label: 'Super Saver Coupon' },
                            { pts: 250, cash: 175, label: 'Mega Commute Voucher' }
                        ].map((coupon, i) => {
                            const canRedeem = loyalty.points >= coupon.pts;
                            return (
                                <div key={i} className="bg-grayBg border border-black/5 p-3.5 rounded-2xl flex items-center justify-between group hover:border-orange/20 transition-all">
                                    <div>
                                        <div className="font-black text-sm text-black group-hover:text-orange transition-colors">{coupon.label}</div>
                                        <div className="text-[10px] font-bold text-[#888] mt-0.5">₹{coupon.cash} credited to your ride wallet</div>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(coupon.pts)}
                                        disabled={!canRedeem}
                                        className={`font-heading text-xs uppercase tracking-wider py-2 px-4 rounded-xl transition-all ${
                                            canRedeem 
                                                ? 'bg-black text-white hover:bg-orange active:scale-95 shadow-md shadow-black/5' 
                                                : 'bg-transparent text-[#bbb] border border-black/5 cursor-not-allowed'
                                        }`}
                                    >
                                        {coupon.pts} Pts
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Viral Referral portal */}
                <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                <Users size={20} />
                            </div>
                            <div>
                                <span className="font-heading text-lg text-black block leading-none mb-1">Referral Hub</span>
                                <span className="text-[9px] font-black text-[#aaa] uppercase tracking-wider">Invite friends & earn ₹50 each</span>
                            </div>
                        </div>
                    </div>

                    {/* Invite Share box */}
                    <div className="bg-[#111] text-white p-5 rounded-[24px] mb-6 relative overflow-hidden">
                        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-orange/10 rounded-full blur-2xl" />
                        <div className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-2">My Unique Referral Code</div>
                        <div className="flex items-center justify-between bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                            <span className="font-heading text-xl text-orange tracking-widest">{referral.code || 'GENERATING...'}</span>
                            <button 
                                onClick={handleCopyCode}
                                className="text-white hover:text-orange transition-colors"
                                title="Copy referral code"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Referral stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-center bg-grayBg p-4 rounded-2xl border border-black/5">
                        <div className="border-r border-black/5">
                            <div className="font-heading text-2xl text-black">{referral.referralsCount}</div>
                            <div className="text-[9px] font-black text-[#888] uppercase tracking-wider">Total Invites</div>
                        </div>
                        <div>
                            <div className="font-heading text-2xl text-orange">₹{referral.earnings}</div>
                            <div className="text-[9px] font-black text-[#888] uppercase tracking-wider">Total Earnings</div>
                        </div>
                    </div>

                    {/* Apply friend code option */}
                    {!user.referredBy ? (
                        <form onSubmit={handleApplyCode} className="pt-4 border-t border-dashed border-black/5">
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1 mb-2">Invited by a friend?</div>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Enter referral code..."
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-grayBg border border-transparent rounded-xl outline-none focus:border-orange/20 focus:bg-white font-bold text-xs text-black uppercase"
                                />
                                <button
                                    type="submit"
                                    disabled={isApplyingCode}
                                    className="bg-black hover:bg-orange text-white font-heading text-xs uppercase tracking-widest px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isApplyingCode ? 'APPLYING...' : 'APPLY'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3.5 text-center text-xs font-bold text-green-600 flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} />
                            Friend referral code successfully linked!
                        </div>
                    )}
                </div>

                {/* Account Details list */}
                <div>
                    <div className="text-[10px] font-black text-[#888] uppercase tracking-[2px] mb-3 ml-2">Personal Information</div>
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

                {/* Settings links */}
                <div className="space-y-3">
                    {[
                        { icon: Bell, title: 'Notifications', color: 'bg-blue-500/10 text-blue-500' },
                        { icon: Shield, title: 'Security & Privacy', color: 'bg-green-500/10 text-green-500' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-black/5 active:scale-95 transition-all cursor-pointer">
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
