import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { 
    Wallet, 
    ArrowUpRight,
    MapPin, 
    Calendar, 
    TrendingUp, 
    Award, 
    Activity, 
    Search, 
    CheckCircle2, 
    XCircle, 
    HelpCircle,
    User,
    ChevronRight,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const WalletPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [wallet, setWallet] = useState({ balance: 0, pendingDues: 0, history: [] });
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isClearingDues, setIsClearingDues] = useState(false);

    const currentUserId = localStorage.getItem('userId');
    const userContext = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchHistory = async () => {
        try {
            setLoading(true);

            // 1. Fetch live wallet details
            try {
                const walletRes = await api.get('/wallet/balance');
                if (walletRes.data) {
                    setWallet(walletRes.data);
                }
            } catch (e) {
                console.error('Failed to fetch wallet details:', e);
            }

            // 2. Fetch ride history for stats
            const res = await api.get('/rides/history');
            if (res.data) {
                // Filter rides where the user was the driver to populate the driver's wallet
                const driverRides = res.data.filter(
                    ride => ride.driverId?._id === currentUserId || ride.driverId === currentUserId
                );
                setHistory(driverRides);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleClearDues = async () => {
        if (wallet.pendingDues <= 0) return;
        try {
            setIsClearingDues(true);
            const res = await api.post('/wallet/pay-dues', { amount: wallet.pendingDues });
            alert(res.data?.msg || 'Dues cleared successfully!');
            fetchHistory();
        } catch (err) {
            console.error('Failed to clear dues:', err);
            alert(err.response?.data?.msg || 'Failed to clear dues. Please try again.');
        } finally {
            setIsClearingDues(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchHistory();
    };

    // Calculate Driver Earnings Metrics
    const completedRides = history.filter(ride => ride.status === 'completed');
    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
    
    const avgFare = completedRides.length 
        ? Math.round(totalEarnings / completedRides.length) 
        : 0;

    const thisMonthEarnings = completedRides
        .filter(ride => {
            const rideDate = new Date(ride.date);
            const now = new Date();
            return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, ride) => sum + (ride.price || 0), 0);

    // Apply Filter & Search
    const filteredRides = history.filter(ride => {
        const matchesFilter = 
            activeFilter === 'all' ||
            (activeFilter === 'completed' && ride.status === 'completed') ||
            (activeFilter === 'cancelled' && ride.status === 'cancelled');

        const passengerName = ride.userId?.name || 'Rider';
        const matchesSearch = 
            passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ride.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ride.drop.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="pb-32 min-h-screen bg-grayBg font-body flex flex-col">
            <Navbar />

            <div className="max-w-[500px] mx-auto w-full px-5 pt-8 flex-1">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 bg-orange/10 text-orange-dark text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full mb-2 border border-orange/10">
                            <Activity size={10} className="animate-pulse" />
                            Driver Earnings
                        </div>
                        <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">My <span className="text-orange">Wallet</span></h2>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className={`w-10 h-10 bg-white hover:bg-orange/5 border border-black/5 rounded-2xl flex items-center justify-center text-orange transition-all active:scale-95 shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Glow balance card */}
                <div className="relative bg-[#111] text-white rounded-[40px] p-8 mb-6 border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.15)] overflow-hidden">
                    <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-orange/10 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-[-50px] left-[-30px] w-48 h-48 bg-orange/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange border border-white/10">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Available Wallet Balance</div>
                                    <div className="text-xs font-bold text-orange-light">{userContext.name || 'Driver Wallet'}</div>
                                </div>
                            </div>
                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/10">
                                Active
                            </div>
                        </div>

                        <div>
                            <div className="text-5xl font-heading tracking-tight flex items-baseline gap-1">
                                <span className="text-orange text-3xl font-black">₹</span>
                                <span className="font-heading text-white text-5xl leading-none font-extrabold">{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-wider mt-3.5 flex items-center gap-1.5">
                                <TrendingUp size={12} className="text-green-500" />
                                Current digital ledger balance
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Dues Alert Block */}
                {wallet.pendingDues > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-[32px] p-6 mb-8 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-heading text-xl text-black leading-none mb-1.5">Pending Penalty Dues</h4>
                                <p className="text-xs font-bold text-[#555] leading-relaxed">
                                    You have an outstanding penalty of <strong className="text-red-600">₹{wallet.pendingDues}</strong> due to cancellations. Please pay now to restore full ride priority.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearDues}
                            disabled={isClearingDues}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-heading text-lg py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-red-500/10"
                        >
                            {isClearingDues ? 'PROCESSING PAYMENT...' : `PAY ₹${wallet.pendingDues} NOW`}
                        </button>
                    </div>
                )}

                {/* Driver Stats row */}
                <div className="grid grid-cols-3 gap-3.5 mb-8">
                    <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-sm flex flex-col justify-between min-h-[110px] hover:-translate-y-0.5 transition-all">
                        <div className="w-8 h-8 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-3">
                            <Award size={16} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-[#888] uppercase tracking-wider leading-none mb-1">Rides Completed</div>
                            <div className="font-heading text-2xl text-black">{completedRides.length}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-sm flex flex-col justify-between min-h-[110px] hover:-translate-y-0.5 transition-all">
                        <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-3">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-[#888] uppercase tracking-wider leading-none mb-1">This Month</div>
                            <div className="font-heading text-2xl text-green-500">₹{thisMonthEarnings}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-sm flex flex-col justify-between min-h-[110px] hover:-translate-y-0.5 transition-all">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-3">
                            <ArrowUpRight size={16} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-[#888] uppercase tracking-wider leading-none mb-1">Avg Fare</div>
                            <div className="font-heading text-2xl text-black">₹{avgFare}</div>
                        </div>
                    </div>
                </div>

                {/* Ride History Section */}
                <div className="flex flex-col flex-1">
                    <h3 className="font-heading text-xl text-black mb-4 flex items-center justify-between">
                        Ride & Payout History
                        <span className="bg-black/5 text-[#888] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            {filteredRides.length} Rides
                        </span>
                    </h3>

                    {/* Filter Tabs & Search Row */}
                    <div className="space-y-4 mb-5">
                        <div className="flex gap-2">
                            {['all', 'completed', 'cancelled'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`flex-1 py-2.5 rounded-xl font-heading text-xs uppercase tracking-wider transition-all border ${
                                        activeFilter === tab 
                                            ? 'bg-black text-white border-black shadow-md' 
                                            : 'bg-white text-[#888] border-black/5 hover:bg-black/5 hover:text-black'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
                            <input 
                                type="text"
                                placeholder="Search by passenger, route..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl outline-none focus:bg-white border border-black/5 focus:border-orange/20 font-bold text-xs text-black shadow-sm transition-all placeholder:text-[#ccc]"
                            />
                        </div>
                    </div>

                    {/* Loader */}
                    {loading ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                            <div className="w-10 h-10 border-4 border-orange/10 border-t-orange rounded-full animate-spin mb-4" />
                            <div className="font-heading text-lg text-[#888]">Fetching your transactions...</div>
                        </div>
                    ) : filteredRides.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center border border-black/5 shadow-sm py-12">
                            <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center text-orange mx-auto mb-4">
                                <Wallet size={28} />
                            </div>
                            <h4 className="font-heading text-xl mb-1">No Transactions Found</h4>
                            <p className="text-xs font-bold text-[#888] leading-relaxed max-w-[280px] mx-auto mb-4">
                                {searchQuery ? 'No rides match your search criteria.' : 'You have not completed or logged any rides in this category.'}
                            </p>
                            {!searchQuery && (
                                <button 
                                    onClick={() => navigate('/')} 
                                    className="bg-black text-white font-heading text-sm py-3 px-6 rounded-xl hover:bg-orange transition-all active:scale-95"
                                >
                                    GO TO DASHBOARD
                                </button>
                            )}
                        </div>
                    ) : (
                        // History list
                        <div className="space-y-4 pr-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                            {filteredRides.map((ride, index) => {
                                const isCompleted = ride.status === 'completed';
                                const isCancelled = ride.status === 'cancelled';
                                const passengerName = ride.userId?.name || 'Rider';
                                const rideDate = new Date(ride.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div 
                                        key={ride._id || index}
                                        className="bg-white p-5 rounded-[28px] border border-black/5 shadow-sm hover:shadow-md hover:border-orange/10 transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-4 border-b border-black/5 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading text-lg ${
                                                    isCompleted ? 'bg-green-500/10 text-green-500' :
                                                    isCancelled ? 'bg-red-500/10 text-red-500' :
                                                    'bg-orange/10 text-orange'
                                                }`}>
                                                    {passengerName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-black">{passengerName}</div>
                                                    <div className="text-[9px] font-bold text-[#aaa] flex items-center gap-1.5 mt-0.5">
                                                        <Calendar size={10} />
                                                        {rideDate}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-heading text-lg leading-none ${isCompleted ? 'text-green-500' : 'text-black/40'}`}>
                                                    {isCompleted ? '+' : ''}₹{ride.price}
                                                </div>
                                                <span className={`inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase mt-1.5 ${
                                                    isCompleted ? 'text-green-600 bg-green-500/10' :
                                                    isCancelled ? 'text-red-500 bg-red-500/10' :
                                                    'text-orange bg-orange/10'
                                                }`}>
                                                    {isCompleted ? <CheckCircle2 size={8} /> : isCancelled ? <XCircle size={8} /> : null}
                                                    {ride.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Address details */}
                                        <div className="space-y-2.5 relative pl-1.5">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                                                <div className="text-[11px] font-bold text-black leading-tight line-clamp-1">{ride.pickup}</div>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange mt-1 shrink-0" />
                                                <div className="text-[11px] font-bold text-[#888] leading-tight line-clamp-1">{ride.drop}</div>
                                            </div>
                                        </div>

                                        {/* Dynamic Details */}
                                        <div className="mt-3.5 pt-3.5 border-t border-dashed border-black/5 flex items-center justify-between text-[9px] font-black uppercase text-[#aaa] tracking-wider">
                                            <span>Vehicle: <strong className="text-black">{ride.vehicleType}</strong></span>
                                            <span>City: <strong className="text-black">{ride.city}</strong></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default WalletPage;
