import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { MapPin, Navigation, Phone, ShieldCheck, Clock } from 'lucide-react';
import api, { socket } from '../utils/api';
import DriverLiveTracker from '../components/DriverLiveTracker';
import DriverRideMap from '../components/DriverRideMap';
import useLiveLocation from '../hooks/useLiveLocation';
import { reverseGeocode } from '../utils/osrmService';

const DriverHome = () => {
    const [activeRide, setActiveRide] = useState(null);
    const [pendingRides, setPendingRides] = useState([]);
    const [online, setOnline] = useState(true);
    const [city, setCity] = useState(localStorage.getItem('driverCity') || 'eluru');

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const activeRes = await api.get('/rides/active');
            
            if (activeRes.data) {
                setActiveRide(activeRes.data);
                setPendingRides([]); 
            } else {
                setActiveRide(null);
                const pendingRes = await api.get(`/rides/pending?city=${city}`);
                setPendingRides(pendingRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const { location } = useLiveLocation();

    useEffect(() => {
        const updateCity = async () => {
            if (location && online) {
                const cityName = await reverseGeocode(location.lat, location.lng);
                if (cityName) {
                    const normalizedCity = cityName.toLowerCase();
                    setCity(normalizedCity);
                    localStorage.setItem('driverCity', normalizedCity);
                    
                    // Sync city with backend for dispatch matching
                    api.post('/auth/update-city', { city: normalizedCity }).catch(e => console.error(e));
                }
            }
        };
        updateCity();
    }, [location, online]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        window.addEventListener('refresh_driver_ride', fetchData);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh_driver_ride', fetchData);
        };
    }, [city]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const joinRoom = () => { if (userId) socket.emit('join', userId); };
        joinRoom();
        socket.on('connect', joinRoom);

        socket.on('new_ride_request', (ride) => {
            const rideCity = ride.city.toLowerCase().trim();
            const driverCity = city.toLowerCase().trim();
            if (online && !activeRide && (rideCity.includes(driverCity) || driverCity.includes(rideCity))) {
                setPendingRides(prev => [ride, ...prev.filter(r => r._id !== ride._id)]);
            }
        });

        socket.on('ride_accepted', (ride) => {
            setPendingRides(prev => prev.filter(r => r._id !== ride._id));
            if (ride.driverId?._id === userId || ride.driverId === userId) {
                setActiveRide(ride);
                setPendingRides([]);
            }
        });

        socket.on('ride_cancelled', (ride) => {
            setPendingRides(prev => prev.filter(r => r._id !== ride._id));
            if (activeRide?._id === ride._id) setActiveRide(null);
        });

        socket.on('ride_completed', () => {
            setActiveRide(null);
            fetchData();
        });

        return () => {
            socket.off('new_ride_request');
            socket.off('ride_accepted');
            socket.off('ride_cancelled');
            socket.off('ride_completed');
            socket.off('connect');
        };
    }, [online, city, activeRide]);

    const markAsPickedUp = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/rides/picked-up', { rideId: activeRide._id });
            setActiveRide(res.data);
        } catch (err) { console.error(err); }
    };

    const completeRide = async () => {
        try {
            const token = localStorage.getItem('token');
            await api.post('/rides/complete', { rideId: activeRide._id });
            setActiveRide(null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const cancelRide = async () => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.post('/rides/cancel', { rideId: activeRide._id });
            setActiveRide(null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleAcceptFromList = async (rideId) => {
        try {
            const idToAccept = String(rideId);
            const token = localStorage.getItem('token');
            const res = await api.post('/rides/accept', { rideId: idToAccept });
            setActiveRide(res.data);
            setPendingRides([]);
        } catch (err) {
            console.error('Accept Error:', err.response?.data);
            const errorMsg = err.response?.data?.msg || 'Ride no longer available';
            alert(`SERVER RESPONSE: ${errorMsg}`);
            fetchData();
        }
    };

    return (
        <div className="pb-32 bg-grayBg min-h-screen font-body flex flex-col">
            <Navbar />
            <DriverLiveTracker rideId={activeRide?._id} isOnline={online} />
            
            <div className="max-w-[500px] mx-auto w-full px-5 pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">Driver <span className="text-orange">Dashboard</span></h2>
                        <p className="text-[#888] font-bold text-sm">You are currently {online ? 'Online' : 'Offline'}</p>
                    </div>
                    <button 
                        onClick={() => setOnline(!online)}
                        className={`w-16 h-8 rounded-full relative transition-all duration-300 ${online ? 'bg-orange shadow-lg shadow-orange/20' : 'bg-black/10'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${online ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {/* Service Area Card */}
                <div className="bg-white rounded-[32px] p-6 mb-8 border border-black/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange/10 rounded-2xl flex items-center justify-center text-orange">
                            <MapPin size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Service Area</div>
                            <input 
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="font-heading text-2xl bg-transparent border-none p-0 focus:ring-0 w-full lowercase outline-none"
                            />
                        </div>
                    </div>
                </div>

                {activeRide && (
                    <div className="relative w-full h-[300px] bg-gray-100 overflow-hidden shadow-inner shrink-0 rounded-[32px] mb-8 border border-black/5">
                        <DriverRideMap ride={activeRide} />
                        <div className="absolute top-4 left-4 z-[1000]">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-xl flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                    {activeRide.status === 'accepted' ? 'Route to Pickup' : 'Route to Drop'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeRide ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-orange/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange/5 rounded-full -mr-16 -mt-16" />
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-2xl text-black">Active Ride</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{activeRide.status === 'accepted' ? 'Heading to Pickup' : 'Heading to Drop'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="font-heading text-3xl text-orange">₹{activeRide.price}</div>
                            </div>

                            <div className="flex items-center gap-5 mb-8 p-4 bg-grayBg rounded-3xl border border-black/5">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black/20 font-heading text-2xl shadow-sm overflow-hidden">
                                    {activeRide.userId?.name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Passenger</div>
                                    <h4 className="font-heading text-2xl text-black leading-none">{activeRide.userId?.name}</h4>
                                    <div className="text-orange font-black text-xs mt-1">{activeRide.userId?.phone}</div>
                                </div>
                                <a href={`tel:${activeRide.userId?.phone}`} className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-90 transition-all">
                                    <Phone size={20} fill="currentColor" />
                                </a>
                            </div>

                            <div className="space-y-6 mb-8 px-2">
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                                    <div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Pick up from</div>
                                        <div className="font-bold text-sm text-black leading-tight mt-0.5">{activeRide.pickup}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-orange mt-1.5" />
                                    <div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Drop off to</div>
                                        <div className="font-bold text-sm text-black leading-tight mt-0.5">{activeRide.drop}</div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={activeRide.status === 'accepted' ? markAsPickedUp : completeRide}
                                className={`w-full py-5 text-white font-heading text-2xl rounded-2xl shadow-xl transition-all active:scale-95 mb-3 ${
                                    activeRide.status === 'accepted' ? 'bg-orange shadow-orange/20' : 'bg-black shadow-black/20'
                                }`}
                            >
                                {activeRide.status === 'accepted' ? 'MARK AS PICKED UP' : 'COMPLETE RIDE'}
                            </button>

                            {activeRide.status === 'accepted' && (
                                <button 
                                    onClick={cancelRide}
                                    className="w-full py-4 bg-grayBg text-[#888] font-heading text-xl rounded-2xl hover:bg-black hover:text-white transition-all active:scale-95"
                                >
                                    CANCEL RIDE
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {pendingRides.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="font-heading text-xl text-black">Available <span className="text-orange">Rides</span></h3>
                                    <div className="bg-orange/10 text-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        {pendingRides.length} Live
                                    </div>
                                </div>
                                {pendingRides.map(ride => (
                                    <div key={ride._id} className="bg-white p-5 rounded-[32px] border border-black/5 shadow-sm hover:border-orange/20 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-grayBg rounded-xl flex items-center justify-center text-black/40 font-heading text-xl uppercase">
                                                    {ride.userId?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm leading-none mb-1">{ride.userId?.name}</div>
                                                    <div className="text-[10px] font-black text-orange uppercase tracking-widest">{ride.vehicleType}</div>
                                                </div>
                                            </div>
                                            <div className="font-heading text-xl text-black">₹{ride.price}</div>
                                        </div>
                                        <div className="space-y-3 mb-5 px-1">
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                                                <div className="text-[11px] font-bold text-[#666] leading-tight line-clamp-1">{ride.pickup}</div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange mt-1" />
                                                <div className="text-[11px] font-bold text-[#666] leading-tight line-clamp-1">{ride.drop}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAcceptFromList(ride._id)}
                                            className="w-full py-3.5 bg-black text-white font-heading text-lg rounded-2xl group-hover:bg-orange transition-all active:scale-95 shadow-lg shadow-black/5"
                                        >
                                            ACCEPT RIDE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[32px] p-10 text-center border border-black/5 shadow-sm mt-10">
                                <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center text-orange mx-auto mb-6">
                                    <Navigation size={40} className={online ? 'animate-pulse' : ''} />
                                </div>
                                <h3 className="font-heading text-2xl mb-2">{online ? 'Waiting for Requests' : 'Go Online to Earn'}</h3>
                                <p className="text-[#888] font-bold text-sm leading-relaxed">
                                    {online ? 'New ride requests in your city will appear here instantly.' : 'You will not receive any new ride requests while offline.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default DriverHome;
