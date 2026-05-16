import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { MapPin, ArrowRight, ShieldCheck, Clock, Wallet, Navigation, Phone, ChevronRight, Loader2, Star, ArrowUpDown } from 'lucide-react';
import api, { socket } from '../utils/api';
import { geocode, searchLocations, getRoute, reverseGeocode } from '../utils/osrmService';
import useLiveLocation from '../hooks/useLiveLocation';
import MapTracking, { pickupIcon, dropIcon } from '../components/MapTracking';
import RoutePolyline from '../components/RoutePolyline';
import { Marker, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import DriverHome from './DriverHome';

const AutoCenter = ({ points }) => {
    const map = useMap();
    React.useEffect(() => {
        if (points && points.length > 0) {
            const validPoints = points.filter(p => p && p[0] && p[1]);
            if (validPoints.length > 0) {
                map.fitBounds(validPoints, { padding: [50, 50] });
            }
        }
    }, [points, map]);
    return null;
};

const HomePage = () => {
    const userRole = localStorage.getItem('userRole');
    const navigate = useNavigate();

    if (userRole === 'driver') {
        return <DriverHome />;
    }

    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [city, setCity] = useState('Hyderabad');
    const [vehicles, setVehicles] = useState([]);
    const [showVehicles, setShowVehicles] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchTimeLeft, setSearchTimeLeft] = useState(180); // 3 minutes in seconds
    const [currentRideId, setCurrentRideId] = useState(null);
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const joinRoom = () => {
            if (userId) {
                console.log('Emitting join for User:', userId);
                socket.emit('join', userId);
            }
        };

        const checkActiveRide = async () => {
            try {
                const res = await api.get('/rides/active');
                if (res.data) {
                    setCurrentRideId(res.data._id);
                    // Only auto-redirect if the ride was JUST accepted and we were searching
                    // or if the user is returning to the app and needs to be informed.
                    // For now, let's just set the state so we can show an "Active Ride" card.
                }
            } catch (err) {
                console.error('Error checking active ride:', err);
            }
        };
        
        checkActiveRide();
        
        if (socket.connected) {
            joinRoom();
        }

        socket.on('connect', joinRoom);

        socket.on('ride_accepted', (booking) => {
            console.log('Ride Accepted Event Received!', booking);
            setIsSearching(false);
            navigate('/tracking', { state: { booking } });
        });

        return () => {
            socket.off('ride_accepted');
            socket.off('connect');
        };
    }, [navigate]);

    // POLLING WHILE SEARCHING OR ACTIVE RIDE
    useEffect(() => {
        let interval;
        if (isSearching || currentRideId) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get('/rides/active');
                    
                    // If no active ride is found, clear all states
                    if (!res.data) {
                        setIsSearching(false);
                        setShowSearchModal(false);
                        setCurrentRideId(null);
                        return;
                    }

                    const status = res.data.status;

                    // If searching and accepted/picked-up, go to tracking
                    if (isSearching && (status === 'accepted' || status === 'picked-up')) {
                        console.log('Polling found accepted ride!');
                        setIsSearching(false);
                        setShowSearchModal(false);
                        navigate('/tracking', { state: { booking: res.data } });
                    }

                    // If ride is completed or cancelled, clear states
                    if (status === 'completed' || status === 'cancelled') {
                        setIsSearching(false);
                        setShowSearchModal(false);
                        setCurrentRideId(null);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isSearching, currentRideId, navigate]);

    // SEARCH TIMEOUT TIMER (3 MINUTES)
    useEffect(() => {
        let timer;
        if (isSearching) {
            setSearchTimeLeft(180);
            timer = setInterval(() => {
                setSearchTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        cancelSearch();
                        alert('No driver accepted your ride in time. Please try again.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isSearching]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (pickup.length > 2 && !pickupCoords) {
                const results = await searchLocations(pickup);
                setPickupSuggestions(results);
            } else {
                setPickupSuggestions([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [pickup, pickupCoords]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (drop.length > 2 && !dropCoords) {
                const results = await searchLocations(drop);
                setDropSuggestions(results);
            } else {
                setDropSuggestions([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [drop, dropCoords]);

    const getVehicles = async () => {
        if (!pickupCoords || !dropCoords) {
            alert('Please select both pickup and drop locations from the list');
            return;
        }
        try {
            // Get real distance from OSRM
            const routeData = await getRoute(pickupCoords, dropCoords);
            if (!routeData) {
                alert('Could not calculate route between these locations.');
                return;
            }
            
            const dist = parseFloat(routeData.distance);
            setDistance(dist);

            const res = await api.get(`/rides/vehicles?distance=${dist}`);
            setVehicles(res.data);
            setShowVehicles(true);
        } catch (err) {
            console.error('Price calculation error:', err);
            alert('Error calculating price. Please try again.');
        }
    };

    const { location: currentLoc } = useLiveLocation();

    const useCurrentLocation = async () => {
        if (!currentLoc) {
            alert('Location access is not available. Please enable GPS.');
            return;
        }
        try {
            const address = await reverseGeocode(currentLoc.lat, currentLoc.lng, true);
            if (address) {
                setPickup(address);
                setPickupCoords({ lat: currentLoc.lat, lng: currentLoc.lng });
            }
        } catch (err) {
            console.error('Error getting current location address:', err);
        }
    };

    const bookRide = async (v) => {
        try {
            const token = localStorage.getItem('token');
            const bookingCity = city.trim() || 'Hyderabad';
            
            const res = await api.post('/rides/book', {
                pickup,
                pickupCoords,
                drop,
                dropCoords,
                vehicleType: v.type,
                price: v.price,
                city: bookingCity
            }, {
                headers: { 'x-auth-token': token }
            });
            
            if (res.data && res.data._id) {
                setCurrentRideId(res.data._id);
            }

            setShowVehicles(false);
            setIsSearching(true);
            setShowSearchModal(true);
        } catch (err) {
            console.error(err);
            alert('Error booking ride');
        }
    };

    const cancelSearch = async () => {
        try {
            if (currentRideId) {
                await api.post('/rides/cancel-search', { rideId: currentRideId });
            }
            setIsSearching(false);
            setShowSearchModal(false);
            setCurrentRideId(null);
        } catch (err) {
            console.error('Error cancelling search:', err);
            setIsSearching(false);
        }
    };

    return (
        <div className="pb-32 bg-[#fdfdfd] animate-fade-in">
            <Navbar />
            
            {/* SEARCHING LOADER MODAL */}
            {isSearching && showSearchModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
                    <div className="w-full max-w-[360px] bg-white rounded-[40px] p-10 text-center shadow-2xl animate-slide-up relative">
                        <button 
                            onClick={() => setShowSearchModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-grayBg rounded-full flex items-center justify-center text-[#888] hover:bg-black hover:text-white transition-all"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>

                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-orange/10 rounded-full" />
                            <div className="absolute inset-0 border-t-4 border-orange rounded-full animate-spin" />
                            <div className="absolute inset-4 bg-orange/5 rounded-full flex items-center justify-center text-orange">
                                <Navigation size={40} className="animate-pulse" />
                            </div>
                        </div>
                        <h3 className="font-heading text-4xl mb-3">Searching <span className="text-orange">Rides</span></h3>
                        <p className="text-[#888] font-bold text-sm leading-relaxed mb-4">
                            Finding the nearest driver for your ride...
                        </p>
                        
                        <div className="mb-8 py-3 bg-orange/5 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-1">Search Timeout</div>
                            <div className="font-heading text-2xl text-orange">
                                {Math.floor(searchTimeLeft / 60)}:{(searchTimeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        <button 
                            onClick={cancelSearch}
                            className="w-full py-4 bg-grayBg text-[#888] font-heading text-xl rounded-2xl hover:bg-black hover:text-white transition-all"
                        >
                            Cancel Search
                        </button>
                    </div>
                </div>
            )}

            {/* HERO */}
            <div className="relative p-6 pb-5 overflow-hidden bg-white">
                <div className="inline-flex items-center gap-2 bg-orange/10 text-orange-dark text-[10px] font-black tracking-widest uppercase px-5 py-2.5 rounded-full mb-3 border border-orange/10 backdrop-blur-sm z-10 relative">
                    <ShieldCheck size={12} fill="currentColor" />
                    Fast & Safe Rides
                </div>
                <div className="flex items-center justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <h1 className="font-heading text-5xl sm:text-6xl leading-[0.9] tracking-tight text-black mb-2.5">
                            <span className="text-orange">Where</span><br />would you<br />like to<br /><span className="text-orange">go?</span>
                        </h1>
                        <p className="text-sm font-semibold text-[#555] leading-relaxed max-w-[280px]">
                            Book your ride with a smooth, colorful & professional experience.
                        </p>
                    </div>
                    <div className="flex-1 flex justify-end animate-bounce-slow">
                        <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full bg-radial-gradient from-orange/10 to-transparent -z-10" />
                        <img src="/11.jpg" alt="Bike" className="w-full max-w-[420px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]" />
                    </div>
                </div>
            </div>

            {/* BOOKING SECTION */}
            <div className="px-5 pt-2">
                <div className="text-lg font-black text-black mb-3.5 flex items-center gap-2">
                    <MapPin size={18} color="var(--orange)" />
                    Book <span className="text-orange">Your Ride</span>
                </div>

                <div className="relative mb-3">
                    <div className="relative group/input">
                        <input 
                            type="text" 
                            placeholder="Enter pickup location..." 
                            value={pickup}
                            onChange={(e) => {
                                setPickup(e.target.value);
                                setPickupCoords(null);
                            }}
                            className="w-full pl-12 pr-12 py-5 bg-grayBg rounded-3xl font-bold text-black border-2 border-transparent focus:border-orange/20 transition-all outline-none"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <button 
                            onClick={useCurrentLocation}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-orange hover:scale-110 transition-transform p-1 rounded-lg hover:bg-orange/10"
                            title="Use Current Location"
                        >
                            <Navigation size={18} fill="currentColor" className="opacity-70" />
                        </button>
                    </div>
                    {pickupSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-[1000] bg-white border border-black/5 rounded-2xl mt-1 shadow-2xl overflow-hidden animate-slide-down">
                            {pickupSuggestions.map((s, i) => (
                                <div key={i} onClick={() => { 
                                    setPickup(s.display_name); 
                                    setPickupCoords(s); 
                                    setPickupSuggestions([]);
                                    // Extract city/town from display_name (usually the second or third part)
                                    const parts = s.display_name.split(',');
                                    if (parts.length > 0) {
                                        setCity(parts[0].trim());
                                    }
                                }} className="px-5 py-3 hover:bg-orange/5 cursor-pointer font-bold text-sm border-b border-black/5 last:border-0 transition-colors">
                                    {s.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end px-3.5 -my-4 relative z-10">
                    <button 
                        onClick={() => { const tmp = pickup; setPickup(drop); setDrop(tmp); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-black/5 text-orange shadow-sm hover:rotate-180 hover:scale-110 hover:border-orange-light hover:shadow-orange/20 transition-all duration-300 active:scale-95"
                    >
                        <ArrowUpDown size={16} />
                    </button>
                </div>

                <div className="relative mb-3">
                    <div className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-2xl border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-orange-light hover:shadow-md transition-all">
                        <div className="w-3.5 h-3.5 rounded-full bg-orange shadow-[0_0_0_4px_rgba(240,90,0,0.15)] animate-pulse shrink-0" />
                        <input 
                            className="flex-1 border-none outline-none font-body text-[15px] font-bold text-black bg-transparent placeholder:text-[#bbb] placeholder:font-semibold" 
                            type="text" 
                            placeholder="Enter drop location…" 
                            value={drop}
                            onChange={(e) => { setDrop(e.target.value); setDropCoords(null); }}
                        />
                    </div>
                    {dropSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-[1000] bg-white border border-black/5 rounded-2xl mt-1 shadow-2xl overflow-hidden animate-slide-down">
                            {dropSuggestions.map((s, i) => (
                                <div key={i} onClick={() => { setDrop(s.display_name); setDropCoords(s); setDropSuggestions([]); }} className="px-5 py-3 hover:bg-orange/5 cursor-pointer font-bold text-sm border-b border-black/5 last:border-0 transition-colors">
                                    {s.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5 py-5 pb-6">
                <button 
                    onClick={getVehicles}
                    className="w-full flex items-center justify-center gap-3 bg-orange text-white border-none rounded-2xl py-5 px-6 font-heading text-2xl tracking-widest shadow-[0_8px_28px_rgba(240,90,0,0.4)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(240,90,0,0.5)] hover:bg-orange-light active:scale-[0.98] active:shadow-none transition-all relative overflow-hidden group"
                >
                    Get Vehicles & Prices
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
                        <ArrowRight size={14} color="white" strokeWidth={3} />
                    </div>
                </button>
            </div>

            {/* BRAND SECTIONS */}
            <div className="px-5 space-y-12 pb-12 animate-fade-in">
                
                {/* STATS BANNER */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-black/5 flex justify-between text-center relative overflow-hidden">
                    <div className="flex-1 border-r border-black/5">
                        <div className="font-heading text-2xl text-orange">50K+</div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Rides</div>
                    </div>
                    <div className="flex-1 border-r border-black/5">
                        <div className="font-heading text-2xl text-orange">4.9★</div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Rating</div>
                    </div>
                    <div className="flex-1">
                        <div className="font-heading text-2xl text-orange">2MIN</div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Pickup</div>
                    </div>
                </div>

                {/* WHY EASYFINDRIDE */}
                <div>
                    <h2 className="font-heading text-3xl mb-8">Why <span className="text-orange">EasyFindRide?</span></h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/20">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm">100% Safe Rides</h4>
                                <p className="text-[11px] font-bold text-[#888] leading-relaxed">Verified drivers with background checks</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/20">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm">2-Min Pickup</h4>
                                <p className="text-[11px] font-bold text-[#888] leading-relaxed">Nearest rider reaches you fast</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/20">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm">Best Fare</h4>
                                <p className="text-[11px] font-bold text-[#888] leading-relaxed">Transparent pricing, no surge</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/20">
                                <Navigation size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm">Live Tracking</h4>
                                <p className="text-[11px] font-bold text-[#888] leading-relaxed">Track your ride in real-time</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HOW IT WORKS */}
                <div>
                    <h2 className="font-heading text-3xl mb-8">How It <span className="text-orange">Works</span></h2>
                    <div className="space-y-8 relative ml-4">
                        <div className="absolute left-[15px] top-[40px] bottom-[40px] w-[2px] bg-orange/20" />
                        
                        <div className="flex gap-6 relative">
                            <div className="w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center font-heading text-lg z-10 shadow-lg shadow-orange/30">1</div>
                            <div>
                                <h4 className="font-black text-sm">Enter Pickup & Drop</h4>
                                <p className="text-[12px] font-bold text-[#888]">Type your current location and where you want to go</p>
                            </div>
                        </div>
                        <div className="flex gap-6 relative">
                            <div className="w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center font-heading text-lg z-10 shadow-lg shadow-orange/30">2</div>
                            <div>
                                <h4 className="font-black text-sm">Choose Your Vehicle</h4>
                                <p className="text-[12px] font-bold text-[#888]">See available bikes, autos & cabs with upfront prices</p>
                            </div>
                        </div>
                        <div className="flex gap-6 relative">
                            <div className="w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center font-heading text-lg z-10 shadow-lg shadow-orange/30">3</div>
                            <div>
                                <h4 className="font-black text-sm">Confirm & Ride</h4>
                                <p className="text-[12px] font-bold text-[#888]">Book in one tap — your rider arrives in minutes</p>
                            </div>
                        </div>
                        <div className="flex gap-6 relative">
                            <div className="w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center font-heading text-lg z-10 shadow-lg shadow-orange/30">4</div>
                            <div>
                                <h4 className="font-black text-sm">Enjoy Safe Ride</h4>
                                <p className="text-[12px] font-bold text-[#888]">Sit back and enjoy your comfortable and safe journey</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TESTIMONIAL CARD */}
                <div className="bg-[#111] rounded-[40px] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-8 opacity-10 font-heading text-[120px] leading-none">"</div>
                    <div className="flex items-center gap-1 mb-4">
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#FF5F00" color="#FF5F00" />)}
                    </div>
                    <p className="font-bold text-sm leading-relaxed mb-6 italic opacity-90">
                        "EasyFindRide is my go-to every day. The pickup is Lightning fast and I always feel safe. Way better than any other app I've tried!"
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center font-heading text-2xl">R</div>
                        <div>
                            <div className="font-black text-sm">Rahul M.</div>
                            <div className="text-[10px] font-bold text-orange uppercase tracking-wider">Daily Commuter - Hyderabad</div>
                        </div>
                    </div>
                </div>

            </div>

            {/* PREMIUM VEHICLE SELECTION MODAL */}
            {showVehicles && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 backdrop-blur-[8px] transition-all duration-500">
                    <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-md rounded-t-[40px] p-8 pb-32 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] animate-slide-up">
                        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8" />
                        
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-heading text-3xl text-black">Select <span className="text-orange">Ride</span></h3>
                                <div className="flex items-center gap-2 mt-1.5 bg-black/5 px-3 py-1 rounded-full w-fit">
                                    <Navigation size={10} className="text-orange" />
                                    <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">
                                        Distance: <span className="text-black">{distance} KM</span>
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowVehicles(false)} 
                                className="bg-grayBg hover:bg-black hover:text-white transition-all w-10 h-10 rounded-xl flex items-center justify-center text-[#888]"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {vehicles.map((v, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => bookRide(v)} 
                                    className="relative flex items-center justify-between p-4 bg-white border border-black/5 rounded-[24px] hover:border-orange/30 hover:bg-orange/5 transition-all cursor-pointer active:scale-[0.98] group overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105 ${
                                            v.type === 'Bike' ? 'bg-orange shadow-orange/20' : 
                                            v.type === 'Auto' ? 'bg-blue-600 shadow-blue-500/20' : 
                                            'bg-purple-700 shadow-purple-600/20'
                                        }`}>
                                            {v.type === 'Bike' ? <Navigation size={24} fill="currentColor" /> : 
                                             v.type === 'Auto' ? <Clock size={24} strokeWidth={2.5} /> : 
                                             <Navigation size={24} fill="currentColor" className="rotate-45" />}
                                        </div>
                                        <div>
                                            <div className="font-heading text-xl text-black">{v.type}</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#888] uppercase">
                                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                                2 mins
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-heading text-2xl text-orange mb-0.5">₹{v.price}</div>
                                        <div className="text-[8px] font-black text-black/20 uppercase tracking-tighter">Fastest</div>
                                    </div>
                                    
                                    {/* Subtle gradient border on hover */}
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange/10 rounded-[24px] pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* FIXED BOTTOM STATUS BARS (ABOVE NAV) */}
            <div className="fixed bottom-24 left-5 right-5 z-[5000] flex flex-col gap-3 pointer-events-none">
                {/* Searching Status Banner */}
                {isSearching && !showSearchModal && (
                    <div 
                        onClick={() => setShowSearchModal(true)}
                        className="pointer-events-auto bg-orange text-white p-6 rounded-[32px] flex items-center justify-between cursor-pointer hover:bg-black transition-all group shadow-2xl shadow-orange/30 animate-pulse animate-slide-up"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                            <div>
                                <div className="font-heading text-xl leading-none mb-1 text-white">Searching for Ride</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white/80">
                                    Ends in {Math.floor(searchTimeLeft / 60)}:{(searchTimeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default HomePage;
