import React, { useState, useEffect } from 'react';
import { Clock, MapPin, X } from 'lucide-react';
import api, { socket } from '../utils/api';

const GlobalRequestPopup = () => {
    const [request, setRequest] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const driverCity = localStorage.getItem('driverCity') || 'Hyderabad';

    useEffect(() => {
        if (userRole !== 'driver') return;

        const userId = localStorage.getItem('userId');
        const joinRoom = () => {
            if (userId) {
                socket.emit('join', userId);
                console.log('Driver joined dispatch room:', userId);
            }
        };

        joinRoom();
        socket.on('connect', joinRoom);

        socket.on('new_ride_request', (ride) => {
            const rideCity = ride.city.toLowerCase().trim();
            const city = driverCity.toLowerCase().trim();

            // Global check for city match (Flexible)
            const isMatch = 
                rideCity.includes(city) || 
                city.includes(rideCity) || 
                ride.pickup.toLowerCase().includes(city) ||
                ride.pickup.toLowerCase().includes(rideCity);

            if (isMatch) {
                setRequest(ride);
            }
        });

        socket.on('ride_accepted', (ride) => {
            if (request && request._id === ride._id) {
                setRequest(null);
            }
        });

        return () => {
            socket.off('new_ride_request');
            socket.off('ride_accepted');
        };
    }, [userRole, driverCity, request]);

    const dismissPopup = () => {
        setRequest(null);
        window.dispatchEvent(new Event('refresh_pending_rides'));
    };

    const acceptRide = async () => {
        try {
            const token = localStorage.getItem('token');
            await api.post('/rides/accept', {
                rideId: request._id
            }, {
                headers: { 'x-auth-token': token }
            });
            setRequest(null);
            window.dispatchEvent(new Event('refresh_driver_ride'));
            window.location.href = '/'; 
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                alert('Ride no longer available.');
            }
            setRequest(null);
            window.dispatchEvent(new Event('refresh_pending_rides'));
        }
    };

    if (!request) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
            <div className="w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl animate-slide-up relative">
                <button onClick={dismissPopup} className="absolute top-6 right-6 text-black/20 hover:text-black">
                    <X size={24} />
                </button>
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange/30">
                        <Clock size={32} />
                    </div>
                    <h3 className="font-heading text-4xl text-black">New <span className="text-orange">Request!</span></h3>
                    <div className="inline-block bg-orange/10 text-orange font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mt-2">
                        {request.vehicleType} Ride • ₹{request.price}
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 shrink-0" />
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Pickup</div>
                            <div className="font-bold text-sm text-black">{request.pickup}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-3 h-3 bg-orange rounded-full mt-1.5 shrink-0" />
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Drop Off</div>
                            <div className="font-bold text-sm text-black">{request.drop}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={dismissPopup}
                        className="flex-1 py-4 bg-grayBg text-[#888] font-heading text-xl rounded-2xl"
                    >
                        Ignore
                    </button>
                    <button 
                        onClick={acceptRide}
                        className="flex-[2] py-4 bg-orange text-white font-heading text-xl rounded-2xl shadow-orange active:scale-95 transition-all"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalRequestPopup;
