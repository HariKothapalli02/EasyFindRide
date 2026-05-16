import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Phone, Navigation, ShieldCheck, MapPin, Clock, Star, MessageSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { socket } from '../utils/api';
import CustomerRideMap from '../components/CustomerRideMap';

const TrackingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { booking: initialBooking } = location.state || {};
    const [booking, setBooking] = React.useState(initialBooking);

    useEffect(() => {
        const fetchActiveRide = async () => {
            if (booking) return; // Already have it from state
            
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const res = await api.get('/rides/active');
                
                if (res.data) {
                    setBooking(res.data);
                }
            } catch (err) {
                console.error('Error fetching active ride:', err);
            }
        };

        fetchActiveRide();
    }, [booking]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // REDIRECT DRIVERS: This page is for customer tracking only.
        if (booking && (booking.driverId?._id === userId || booking.driverId === userId)) {
            navigate('/');
            return;
        }

        socket.emit('join', userId);

        socket.on('ride_picked_up', (updatedRide) => {
            setBooking(updatedRide);
        });

        socket.on('ride_completed', () => {
            alert('Ride completed! Hope you enjoyed your journey.');
            navigate('/bookings');
        });

        socket.on('ride_cancelled', () => {
            alert('Your ride was cancelled.');
            navigate('/');
        });

        return () => {
            socket.off('ride_picked_up');
            socket.off('ride_completed');
            socket.off('ride_cancelled');
        };
    }, [navigate, booking]);

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.post('/rides/cancel', { rideId: booking._id });
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-grayBg animate-fade-in">
                <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center text-orange mb-6">
                    <Navigation size={40} />
                </div>
                <h2 className="font-heading text-4xl mb-4">No Active Ride</h2>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-orange text-white rounded-2xl font-heading text-xl shadow-orange">Go Home</button>
            </div>
        );
    }

    const driver = booking.driverId;
    const isPickedUp = booking.status === 'picked-up';

    return (
        <div className="bg-grayBg min-h-screen animate-fade-in overflow-hidden flex flex-col">
            <Navbar />
            
            {/* MAP SECTION */}
            <div className="relative flex-1 min-h-[350px] bg-[#f9f9f9] overflow-hidden">
                <CustomerRideMap ride={booking} />
                
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[1000]">
                    <div className="bg-white/90 backdrop-blur-md px-6 py-3.5 rounded-full border border-white shadow-xl flex items-center gap-3 justify-center animate-slide-down">
                        <div className={`w-2 h-2 ${isPickedUp ? 'bg-orange' : 'bg-green-500'} rounded-full animate-pulse`} />
                        <span className="text-[12px] font-black uppercase tracking-widest text-black">
                            {isPickedUp ? 'Picked Up & On the way' : 'Driver is arriving soon'}
                        </span>
                    </div>
                </div>
            </div>

            {/* FLOATING DRIVER CARD */}
            <div className="relative z-30 px-6 pb-24 -mt-16">
                <div className="bg-white rounded-[44px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.12)] border border-black/5 animate-slide-up">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange to-orange-dark rounded-[28px] flex items-center justify-center text-white font-heading text-4xl shadow-lg shadow-orange/30 overflow-hidden ring-4 ring-orange/5">
                                {driver.profilePhoto ? <img src={driver.profilePhoto} className="w-full h-full object-cover" alt="Driver" /> : driver.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#22c55e] rounded-xl flex items-center justify-center border-4 border-white shadow-md">
                                <ShieldCheck size={12} color="white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-heading text-3xl leading-none text-black">{driver.name}</h3>
                                <div className="flex items-center gap-1 text-orange font-black text-sm">
                                    <Star size={14} fill="currentColor" />
                                    4.9
                                </div>
                            </div>
                            <div className="font-black text-[14px] text-orange mb-2.5">
                                {driver.phone}
                            </div>
                            <div className="font-black text-[11px] text-black/40 uppercase tracking-wider mb-3">
                                {booking.vehicleType} • {driver.vehicleNumber}
                            </div>
                            <div className="flex gap-2.5">
                                <a href={`tel:${driver.phone}`} className="flex-1 h-11 bg-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange/20 transition-all active:scale-95">
                                    <Phone size={18} />
                                </a>
                                <button className="flex-1 h-11 bg-black/5 text-black rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all active:scale-95">
                                    <MessageSquare size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 mb-8 relative">
                        <div className="absolute left-[7px] top-[24px] bottom-[24px] w-[2px] bg-black/5" />
                        <div className="flex items-start gap-4">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm mt-1 shrink-0 z-10" />
                            <div>
                                <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Pickup</div>
                                <div className="font-bold text-[15px] text-black leading-tight">{booking.pickup}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-4 h-4 rounded-full bg-orange border-4 border-white shadow-sm mt-1 shrink-0 z-10" />
                            <div>
                                <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Destination</div>
                                <div className="font-bold text-[15px] text-black leading-tight">{booking.drop}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-grayBg rounded-[28px] mb-8 border border-black/5">
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Fare Details</div>
                            <div className="font-heading text-4xl text-orange">₹{booking.price}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Payment Method</div>
                            <div className="inline-flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-full">
                                <Star size={12} className="text-orange" />
                                <span className="font-black text-[11px] uppercase text-black">Cash on Delivery</span>
                            </div>
                        </div>
                    </div>

                    {!isPickedUp && (
                        <button 
                            onClick={handleCancel}
                            className="w-full py-5 bg-black text-white font-heading text-2xl rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:bg-orange hover:shadow-orange/30 transition-all active:scale-95"
                        >
                            Cancel Ride
                        </button>
                    )}
                    {isPickedUp && (
                        <div className="w-full py-5 bg-orange/10 text-orange font-heading text-xl rounded-2xl border border-orange/20 text-center animate-pulse">
                            RIDE IN PROGRESS
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

export default TrackingPage;
