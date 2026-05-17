import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, ChevronRight, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { socket } from '../utils/api';

const FloatingTracker = () => {
    const [activeRide, setActiveRide] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const myId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchActiveRide = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await api.get('/rides/active');
                if (res.data) {
                    setActiveRide(res.data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchActiveRide();

        if (myId) socket.emit('join', myId);

        const onRideAccepted = (ride) => setActiveRide(ride);
        const onRidePickedUp = (ride) => setActiveRide(ride);
        const onRideCompleted = () => setActiveRide(null);
        const onRideCancelled = () => setActiveRide(null);

        socket.on('ride_accepted', onRideAccepted);
        socket.on('ride_picked_up', onRidePickedUp);
        socket.on('ride_completed', onRideCompleted);
        socket.on('ride_cancelled', onRideCancelled);

        return () => {
            socket.off('ride_accepted', onRideAccepted);
            socket.off('ride_picked_up', onRidePickedUp);
            socket.off('ride_completed', onRideCompleted);
            socket.off('ride_cancelled', onRideCancelled);
        };
    }, [myId]);

    if (!activeRide) return null;

    const isDriver = activeRide.driverId?._id === myId || activeRide.driverId === myId;

    // HIDE FOR DRIVERS: Per user request, tracking is only for customers.
    // Drivers already have their dashboard for tracking.
    if (isDriver) return null;

    // Don't show if we are already on the tracking page
    if (location.pathname === '/tracking') return null;

    return (
        <div 
            onClick={() => {
                if (isDriver) {
                    navigate('/');
                    window.dispatchEvent(new Event('refresh_driver_ride'));
                } else {
                    navigate('/tracking', { state: { booking: activeRide } });
                }
            }}
            className="fixed bottom-28 left-4 right-4 z-[9999] animate-slide-up cursor-pointer max-w-[450px] mx-auto"
        >
            <div className="bg-white rounded-[28px] p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.12)] border border-black/5 flex items-center gap-4 group hover:bg-orange/5 transition-all active:scale-[0.98]">
                <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/30">
                    {activeRide.status === 'picked-up' ? <Navigation size={24} /> : <Clock size={24} className="animate-pulse" />}
                </div>
                <div className="flex-1">
                    <div className="text-[10px] font-black text-orange uppercase tracking-[1.5px] mb-0.5">
                        {isDriver ? (activeRide.status === 'picked-up' ? 'Heading to Drop' : 'Go to Pickup') : (activeRide.status === 'picked-up' ? 'Ride in Progress' : 'Driver is Arriving')}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-heading text-lg text-black leading-none">
                            {isDriver ? `Ride with ${activeRide.userId?.name}` : `${activeRide.driverId?.name || 'Driver'} is ${activeRide.status === 'picked-up' ? 'on the way' : 'arriving now'}`}
                        </span>
                    </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-grayBg flex items-center justify-center text-black group-hover:bg-orange group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                </div>
            </div>
        </div>
    );
};

export default FloatingTracker;
