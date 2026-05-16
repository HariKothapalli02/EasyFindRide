import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { MapPin, ArrowRight, ShieldCheck, Clock, Wallet, Navigation, Phone, ChevronRight, Loader2, Star, ArrowUpDown } from 'lucide-react';
import api, { socket } from '../utils/api';
import { geocode, searchLocations } from '../utils/osrmService';
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

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const joinRoom = () => {
            if (userId) socket.emit('join', userId);
        };
        joinRoom();
        socket.on('connect', joinRoom);

        socket.on('ride_accepted', (booking) => {
            setIsSearching(false);
            navigate('/tracking', { state: { booking } });
        });

        return () => {
            socket.off('ride_accepted');
            socket.off('connect');
        };
    }, [navigate]);

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
        if (!pickup || !drop) {
            alert('Please enter both pickup and drop locations.');
            return;
        }
        try {
            const res = await api.get(`/rides/vehicles?pickup=${pickup}&drop=${drop}`);
            setVehicles(res.data);
            setShowVehicles(true);
        } catch (err) {
            console.error(err);
        }
    };

    const bookRide = async (v) => {
        try {
            const token = localStorage.getItem('token');
            const bookingCity = city.trim() || 'Hyderabad';
            
            await api.post('/rides/book', {
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
            setShowVehicles(false);
            setIsSearching(true);
        } catch (err) {
            console.error(err);
            alert('Error booking ride');
        }
    };

    return (
        <div className="pb-32 bg-[#fdfdfd] animate-fade-in">
            <Navbar />
            
            {/* SEARCHING LOADER */}
            {isSearching && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
                    <div className="w-full max-w-[360px] bg-white rounded-[40px] p-10 text-center shadow-2xl animate-slide-up">
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-orange/10 rounded-full" />
                            <div className="absolute inset-0 border-t-4 border-orange rounded-full animate-spin" />
                            <div className="absolute inset-4 bg-orange/5 rounded-full flex items-center justify-center text-orange">
                                <Navigation size={40} className="animate-pulse" />
                            </div>
                        </div>
                        <h3 className="font-heading text-4xl mb-3">Searching <span className="text-orange">Rides</span></h3>
                        <p className="text-[#888] font-bold text-sm leading-relaxed mb-8">
                            Finding the nearest driver for your <span className="text-black">Bike</span> ride...
                        </p>
                        <button 
                            onClick={() => setIsSearching(false)}
                            className="w-full py-4 bg-grayBg text-[#888] font-heading text-xl rounded-2xl hover:bg-black hover:text-white transition-all"
                        >
                            Cancel Search
                        </button>
                    </div>
                </div>
            )}

            {/* HERO & MAP PREVIEW */}
            <div className="relative p-6 pb-2 overflow-hidden bg-white">
                <div className="inline-flex items-center gap-2 bg-orange/10 text-orange-dark text-[10px] font-black tracking-widest uppercase px-5 py-2.5 rounded-full mb-3 border border-orange/10 backdrop-blur-sm z-10 relative">
                    <ShieldCheck size={12} fill="currentColor" />
                    Fast & Safe Rides
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex-1 w-full">
                        <h1 className="font-heading text-4xl sm:text-6xl leading-[0.9] tracking-tight text-black mb-2.5">
                            <span className="text-orange">Where</span> to?
                        </h1>
                        
                        {/* MAP PREVIEW BOX */}
                        <div className="w-full h-[200px] bg-grayBg rounded-3xl mt-4 overflow-hidden border border-black/5 relative shadow-inner">
                            <MapTracking center={[17.3850, 78.4867]} zoom={12}>
                                {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />}
                                {dropCoords && <Marker position={[dropCoords.lat, dropCoords.lng]} icon={dropIcon} />}
                                {pickupCoords && dropCoords && <RoutePolyline start={pickupCoords} end={dropCoords} />}
                                <AutoCenter points={[pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : null, dropCoords ? [dropCoords.lat, dropCoords.lng] : null].filter(Boolean)} />
                            </MapTracking>
                        </div>
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
                    <div className="flex items-center gap-3.5 px-5 py-4 bg-white rounded-2xl border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-orange-light hover:shadow-md transition-all relative group">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#22c55e] shadow-[0_0_0_4px_rgba(34,197,94,0.15)] animate-pulse shrink-0" />
                        <input 
                            className="flex-1 border-none outline-none font-body text-[15px] font-bold text-black bg-transparent placeholder:text-[#bbb] placeholder:font-semibold" 
                            type="text" 
                            placeholder="Enter pickup location…" 
                            value={pickup}
                            onChange={(e) => { setPickup(e.target.value); setPickupCoords(null); }}
                        />
                    </div>
                    {pickupSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-[1000] bg-white border border-black/5 rounded-2xl mt-1 shadow-2xl overflow-hidden animate-slide-down">
                            {pickupSuggestions.map((s, i) => (
                                <div key={i} onClick={() => { setPickup(s.display_name); setPickupCoords(s); setPickupSuggestions([]); }} className="px-5 py-3 hover:bg-orange/5 cursor-pointer font-bold text-sm border-b border-black/5 last:border-0 transition-colors">
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
                    <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-md rounded-t-[40px] p-8 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] animate-slide-up">
                        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8" />
                        
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h3 className="font-heading text-4xl leading-none">Select <span className="text-orange">Your Ride</span></h3>
                                <p className="text-[11px] font-black text-[#888] uppercase tracking-[2px] mt-2">Available near you</p>
                            </div>
                            <button onClick={() => setShowVehicles(false)} className="bg-grayBg hover:bg-black hover:text-white transition-all w-10 h-10 rounded-2xl flex items-center justify-center text-[#888]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {vehicles.map((v, i) => (
                                <div key={i} onClick={() => bookRide(v)} className="relative flex items-center justify-between p-5 bg-white border border-black/5 rounded-[28px] hover:border-orange hover:shadow-[0_15px_30px_rgba(255,95,0,0.12)] transition-all cursor-pointer active:scale-[0.97] group overflow-hidden">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-gradient-to-br from-orange to-orange-dark rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange/30 group-hover:scale-110 transition-transform duration-300">
                                            {v.type === 'Bike' ? <Navigation size={32} /> : v.type === 'Auto' ? <Clock size={32} /> : <Navigation size={32} className="rotate-45" />}
                                        </div>
                                        <div>
                                            <div className="font-heading text-2xl tracking-wide">{v.type}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#888]">
                                                <Clock size={12} className="text-orange" />
                                                2 mins away • 4.8★
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-heading text-3xl text-orange mb-0.5">₹{v.price}</div>
                                        <div className="text-[9px] font-black text-[#bbb] uppercase tracking-wider">Fastest</div>
                                    </div>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-orange translate-x-full group-hover:translate-x-0 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default HomePage;
