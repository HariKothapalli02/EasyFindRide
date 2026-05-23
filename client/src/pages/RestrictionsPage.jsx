import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { 
    ShieldAlert, 
    AlertTriangle, 
    Activity, 
    Calendar, 
    Clock, 
    DollarSign, 
    TrendingUp, 
    Info, 
    Lock, 
    Scale, 
    HelpCircle,
    RotateCcw,
    RefreshCw
} from 'lucide-react';
import api from '../utils/api';

const RestrictionsPage = () => {
    const [status, setStatus] = useState({
        fraudScore: 0,
        restrictionLevel: 'Normal',
        suspensionStatus: false,
        unpaidPenaltyAmount: 0,
        cancellationCount: 0,
        noShowCount: 0,
        warnings: ["Your profile is in perfect standing. Have a safe ride!"]
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isClearingPenalty, setIsClearingPenalty] = useState(false);

    const fetchStatusAndHistory = async () => {
        try {
            setLoading(true);
            const [statusRes, historyRes] = await Promise.all([
                api.get('/penalties/customer-status'),
                api.get('/penalties/customer-history')
            ]);

            if (statusRes.data) setStatus(statusRes.data);
            if (historyRes.data) setHistory(historyRes.data);
        } catch (err) {
            console.error('Failed to fetch restrictions data:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleClearPenalty = async () => {
        if (status.unpaidPenaltyAmount <= 0) return;
        try {
            setIsClearingPenalty(true);
            const res = await api.post('/penalties/clear-penalty');
            alert(res.data?.msg || 'Penalty dues cleared successfully!');
            fetchStatusAndHistory();
        } catch (err) {
            console.error('Failed to clear penalties:', err);
            alert(err.response?.data?.msg || 'Failed to clear outstanding dues. Please check your wallet balance.');
        } finally {
            setIsClearingPenalty(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchStatusAndHistory();
    };

    useEffect(() => {
        fetchStatusAndHistory();
    }, []);

    // Derived Fraud Risk Labels
    const getRiskLabel = (score) => {
        if (score >= 75) return { text: 'CRITICAL THREAT', color: 'text-red-600 bg-red-500/10 border-red-500/20', bar: 'bg-red-600' };
        if (score >= 50) return { text: 'HIGH RISK', color: 'text-orange bg-orange/10 border-orange/20', bar: 'bg-orange' };
        if (score >= 25) return { text: 'MEDIUM RISK', color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500' };
        return { text: 'LOW RISK', color: 'text-green-600 bg-green-500/10 border-green-500/20', bar: 'bg-green-500' };
    };

    const risk = getRiskLabel(status.fraudScore);

    // Derived Dynamic Restriction status display
    const getRestrictionDisplay = (level) => {
        switch (level) {
            case 'Blocked':
                return { label: 'ACCOUNT LOCKED', desc: 'Full booking restrictions are active. Your account is under immediate review due to severe abuse patterns or fake bookings.', color: 'bg-red-600 text-white' };
            case 'Cooldown':
                return { label: 'TEMPORARY COOLDOWN', desc: 'Booking suspended temporarily. Excessive cancellations detected. Try again in 10 minutes.', color: 'bg-orange text-white' };
            case 'Restricted':
                return { label: 'LIMITS IMPOSED', desc: 'Cash payment rides are disabled. Only digital pre-paid wallet bookings are permitted due to previous cancellation dues.', color: 'bg-yellow-500 text-black' };
            case 'Warning':
                return { label: 'POLICY WARNING ACTIVE', desc: 'Frequent booking cancellations observed. Keep cancellation count low to avoid temporary cool periods.', color: 'bg-black text-orange border border-orange/20' };
            default:
                return { label: 'NORMAL STANDING', desc: 'Your account is in excellent health. Booking prioritizations are standard.', color: 'bg-green-500 text-white' };
        }
    };

    const restriction = getRestrictionDisplay(status.restrictionLevel);

    return (
        <div className="pb-32 bg-grayBg min-h-screen font-body flex flex-col">
            <Navbar />

            <div className="max-w-[500px] mx-auto w-full px-5 pt-8 flex-1">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-600 text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full mb-2 border border-red-500/10">
                            <Scale size={10} />
                            Policy Enforcement
                        </div>
                        <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">Limits & <span className="text-orange">Safety</span></h2>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className={`w-10 h-10 bg-white hover:bg-orange/5 border border-black/5 rounded-2xl flex items-center justify-center text-orange transition-all active:scale-95 shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh Status"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-10 h-10 border-4 border-orange/10 border-t-orange rounded-full animate-spin mb-4" />
                        <div className="font-heading text-lg text-[#888]">Analyzing account telemetry...</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Dynamic Warning Notification Banners */}
                        <div className="space-y-2">
                            {status.warnings.map((warn, index) => (
                                <div key={index} className="bg-white border-l-4 border-orange rounded-2xl p-4 shadow-sm flex items-start gap-3 border-y border-r border-black/5 animate-fade-in">
                                    <ShieldAlert size={18} className="text-orange shrink-0 mt-0.5" />
                                    <div className="text-xs font-bold text-[#444] leading-relaxed">{warn}</div>
                                </div>
                            ))}
                        </div>

                        {/* Customer Penalty Overview Card */}
                        <div className={`rounded-[32px] p-6 shadow-md border ${
                            status.restrictionLevel === 'Blocked' || status.restrictionLevel === 'Cooldown'
                                ? 'bg-[#111] text-white border-red-500/20'
                                : 'bg-white text-black border-black/5'
                        }`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#888]">Account Safety Overview</div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${restriction.color}`}>
                                    {restriction.label}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-heading text-2xl mb-1">{status.restrictionLevel} Status</h3>
                                <p className={`text-xs font-bold leading-relaxed ${
                                    status.restrictionLevel === 'Blocked' || status.restrictionLevel === 'Cooldown'
                                        ? 'text-white/60'
                                        : 'text-[#666]'
                                }`}>
                                    {restriction.desc}
                                </p>
                            </div>

                            {/* Dues Status if present */}
                            {status.unpaidPenaltyAmount > 0 && (
                                <div className="mt-5 pt-5 border-t border-dashed border-black/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-wider text-red-500">Unpaid Penalty Dues</div>
                                        <div className="font-heading text-2xl text-red-600 mt-0.5">₹{status.unpaidPenaltyAmount}</div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full border border-red-500/10">
                                        Restricting Rides
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Visual Fraud Score Meter Card */}
                        <div className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-heading text-lg text-black">Security Risk Profile</h4>
                                    <p className="text-[9px] font-black text-[#888] uppercase tracking-wider">Automated system anti-abuse score indicator</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${risk.color}`}>
                                    {risk.text}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1.5 mb-3.5">
                                <span className="font-heading text-4xl text-black font-black leading-none">{status.fraudScore}%</span>
                                <span className="text-xs text-[#aaa] font-bold">/ 100% risk index</span>
                            </div>

                            {/* Threat Progress Meter Bar */}
                            <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden mb-3 relative">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${risk.bar}`}
                                    style={{ width: `${status.fraudScore}%` }}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-grayBg rounded-2xl p-3 border border-black/5 text-[10px] font-bold text-[#888] leading-relaxed">
                                <Info size={14} className="text-orange shrink-0" />
                                <span>Risk indexes above 75% trigger permanent account reviewing, freezing wallet balances, and locking ride dispatches.</span>
                            </div>
                        </div>

                        {/* Unpaid Dues settlement panel */}
                        {status.unpaidPenaltyAmount > 0 && (
                            <div className="bg-white rounded-[32px] p-6 border-2 border-red-500/20 shadow-md">
                                <div className="flex items-start gap-3.5 mb-4">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-heading text-lg text-black leading-none mb-1">Unpaid Dues Settle Panel</h4>
                                        <p className="text-[10px] font-bold text-[#888] leading-relaxed">
                                            Deduct outstanding penalty dues from your active digital wallet to instantly unlock booking controls.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClearPenalty}
                                    disabled={isClearingPenalty}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-heading text-lg rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/10"
                                >
                                    {isClearingPenalty ? 'Settle Balance...' : `SETTLE ₹${status.unpaidPenaltyAmount} WITH WALLET`}
                                </button>
                                <div className="text-center mt-2.5 text-[9px] font-black uppercase text-[#aaa] tracking-wider">
                                    Auto-applied prior to subsequent matching
                                </div>
                            </div>
                        )}

                        {/* Cancellation Tracking System Card Grid */}
                        <div>
                            <h3 className="font-heading text-xl text-black mb-3 px-1">Cancellation Telemetry Analytics</h3>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm flex flex-col justify-between min-h-[110px]">
                                    <div className="w-8 h-8 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-3 shrink-0">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-[#888] uppercase tracking-wider mb-0.5">Total Cancellations</div>
                                        <div className="font-heading text-2xl text-black">{status.cancellationCount}</div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm flex flex-col justify-between min-h-[110px]">
                                    <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 mb-3 shrink-0">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-[#888] uppercase tracking-wider mb-0.5">No-Show Incidents</div>
                                        <div className="font-heading text-2xl text-black">{status.noShowCount}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Penalty History Table */}
                        <div>
                            <h3 className="font-heading text-xl text-black mb-3 flex items-center justify-between px-1">
                                Penalty Audit Logs
                                <span className="bg-black/5 text-[#888] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                                    {history.length} Logs
                                </span>
                            </h3>

                            {history.length === 0 ? (
                                <div className="bg-white rounded-3xl p-10 text-center border border-black/5 shadow-sm">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-3">
                                        <Scale size={20} />
                                    </div>
                                    <h4 className="font-heading text-lg mb-0.5">No Penalty History</h4>
                                    <p className="text-[10px] font-bold text-[#888] leading-relaxed max-w-[240px] mx-auto">
                                        You do not have any chargeable cancellations or policy violations logged.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((log, index) => {
                                        const rideDate = new Date(log.date).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                        return (
                                            <div 
                                                key={index} 
                                                className="bg-white p-5 rounded-[28px] border border-black/5 shadow-sm flex flex-col gap-3.5"
                                            >
                                                <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading text-lg font-black ${
                                                            log.penaltyType === 'No-Show' ? 'bg-red-500/10 text-red-600' : 'bg-orange/10 text-orange'
                                                        }`}>
                                                            {log.penaltyType === 'No-Show' ? 'NS' : 'LC'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-xs text-black leading-none mb-1">{log.penaltyType} Violation</h4>
                                                            <div className="text-[9px] font-bold text-[#aaa] flex items-center gap-1">
                                                                <Calendar size={8} />
                                                                {rideDate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-heading text-lg text-red-600 leading-none">-₹{log.amount}</div>
                                                        <div className="text-[7.5px] font-black text-[#aaa] uppercase tracking-wider mt-1">{log.status}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 px-1 text-xs">
                                                    <div className="flex items-baseline gap-1 font-bold text-[#555]">
                                                        <span className="text-[#888] font-black text-[9px] uppercase tracking-wider w-16 block shrink-0">Reason:</span>
                                                        <span className="text-black">{log.reason}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1 font-bold text-[#555]">
                                                        <span className="text-[#888] font-black text-[9px] uppercase tracking-wider w-16 block shrink-0">Action:</span>
                                                        <span className="text-green-600 font-extrabold">{log.actionTaken}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1 font-mono text-[9px] text-[#aaa]">
                                                        <span className="text-[#888] font-black text-[8px] uppercase tracking-wider w-16 block shrink-0">Ride ID:</span>
                                                        <span>{log.rideId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Policy Appeal Support Footer */}
                        <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm text-center">
                            <HelpCircle size={22} className="text-orange mx-auto mb-2" />
                            <h4 className="font-black text-xs text-black mb-1">Believe this is a mistake?</h4>
                            <p className="text-[10px] font-bold text-[#888] leading-relaxed max-w-[280px] mx-auto mb-3">
                                You can appeal system-applied penalties or blocks for review by an administrative human moderator.
                            </p>
                            <button
                                onClick={() => alert("Appeal submitted! An administrative moderator will review your ride cancellation log within 24 hours.")}
                                className="w-full py-2.5 border border-orange text-orange hover:bg-orange/5 font-heading text-xs uppercase tracking-widest rounded-xl transition-all"
                            >
                                SUBMIT POLICY APPEAL
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default RestrictionsPage;
