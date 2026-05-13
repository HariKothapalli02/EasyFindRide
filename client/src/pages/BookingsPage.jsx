import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { ClipboardList, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get('/rides/history');
                setBookings(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="pb-32 min-h-screen bg-grayBg">
            <Navbar />
            
            <div className="p-6">
                <div className="font-heading text-4xl mb-2">My <span className="text-orange">Bookings</span></div>
                <p className="text-[#888] font-bold text-sm mb-8">View your recent ride history</p>

                <div className="space-y-4">
                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-black/5">
                            <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center text-orange mx-auto mb-4">
                                <ClipboardList size={32} />
                            </div>
                            <h3 className="font-black text-lg mb-1">No rides yet</h3>
                            <p className="text-[#888] text-sm font-bold">Your booking history will appear here.</p>
                        </div>
                    ) : (
                        bookings.map((b, i) => (
                            <div key={i} className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm active:scale-95 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center text-white">
                                            {b.vehicleType === 'Bike' ? <Clock size={20} /> : <MapPin size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-black">{b.vehicleType} Ride</div>
                                            <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block uppercase ${
                                                b.status === 'completed' ? 'text-green-500 bg-green-500/10' : 
                                                b.status === 'accepted' ? 'text-blue-500 bg-blue-500/10' : 
                                                'text-orange bg-orange/10'
                                            }`}>
                                                {b.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-heading text-orange">₹{b.price}</div>
                                </div>
                                
                                <div className="space-y-3 relative mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <div className="text-[13px] font-bold text-black">{b.pickup}</div>
                                    </div>
                                    <div className="absolute left-[3px] top-[14px] bottom-[14px] w-[2px] bg-black/5" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange mt-1.5 shrink-0" />
                                        <div className="text-[13px] font-bold text-black">{b.drop}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#888]">
                                            <Calendar size={12} />
                                            {new Date(b.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedBooking(b)}
                                        className="flex items-center gap-1 text-[11px] font-black text-orange uppercase tracking-wider"
                                    >
                                        Details
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* DETAILS MODAL */}
            {selectedBooking && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 backdrop-blur-md p-0 animate-fade-in">
                    <div className="w-full max-w-[420px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl animate-slide-up">
                        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-heading text-4xl">Ride <span className="text-orange">Details</span></h3>
                            <button onClick={() => setSelectedBooking(null)} className="bg-grayBg hover:bg-black hover:text-white transition-all w-10 h-10 rounded-2xl flex items-center justify-center text-[#888]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-4 p-4 bg-orange/5 rounded-3xl border border-orange/10">
                                <div className="w-16 h-16 bg-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange/20 font-heading text-3xl">
                                    {selectedBooking.driverId?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Driver</div>
                                    <div className="font-bold text-lg text-black">{selectedBooking.driverId?.name || 'Not Assigned'}</div>
                                    <div className="text-[11px] font-bold text-orange uppercase tracking-widest">{selectedBooking.driverId?.vehicleNumber || '----'}</div>
                                </div>
                            </div>

                            <div className="space-y-6 relative ml-2">
                                <div className="absolute left-[7px] top-[24px] bottom-[24px] w-[2px] bg-black/5" />
                                <div className="flex items-start gap-4">
                                    <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm mt-1 shrink-0 z-10" />
                                    <div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Pickup</div>
                                        <div className="font-bold text-sm text-black leading-tight">{selectedBooking.pickup}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-4 h-4 rounded-full bg-orange border-4 border-white shadow-sm mt-1 shrink-0 z-10" />
                                    <div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Destination</div>
                                        <div className="font-bold text-sm text-black leading-tight">{selectedBooking.drop}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-grayBg rounded-3xl border border-black/5">
                                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Total Fare</div>
                                    <div className="font-heading text-4xl text-orange">₹{selectedBooking.price}</div>
                                </div>
                                <div className="p-5 bg-grayBg rounded-3xl border border-black/5">
                                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Status</div>
                                    <div className="font-heading text-2xl text-black uppercase tracking-widest">{selectedBooking.status}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default BookingsPage;
