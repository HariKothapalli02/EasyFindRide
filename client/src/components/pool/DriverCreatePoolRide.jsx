import React, { useState } from 'react';
import { createPoolRide } from '../../services/poolRideService';
import { searchLocation } from '../../services/locationSearchService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import BottomNav from '../BottomNav';
import { MapPin, Navigation, Calendar, Users, Car, Hash, Palette } from 'lucide-react';

const DriverCreatePoolRide = () => {
    const [startQuery, setStartQuery] = useState('');
    const [endQuery, setEndQuery] = useState('');
    const [startLocation, setStartLocation] = useState(null);
    const [endLocation, setEndLocation] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [totalSeats, setTotalSeats] = useState(4);
    const [cabDetails, setCabDetails] = useState({ model: '', number: '', color: '' });
    
    const [searchResults, setSearchResults] = useState({ type: null, results: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSearch = async (query, type) => {
        if (!query) return;
        const results = await searchLocation(query);
        setSearchResults({ type, results });
    };

    const selectLocation = (loc, type) => {
        if (type === 'start') {
            setStartLocation(loc);
            setStartQuery(loc.address);
        } else {
            setEndLocation(loc);
            setEndQuery(loc.address);
        }
        setSearchResults({ type: null, results: [] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!startLocation || !endLocation) {
            return setError('Please select valid start and end locations from search results.');
        }

        try {
            setLoading(true);
            const driverId = JSON.parse(localStorage.getItem('user'))?._id;
            
            const data = {
                driverId,
                startLocation,
                endLocation,
                startTime,
                totalSeats: Number(totalSeats),
                cabDetails
            };

            const response = await createPoolRide(data);
            if (response.success) {
                navigate(`/pool/track/${response.poolRide._id}`);
            }
        } catch (err) {
            setError(err.message || 'Failed to create pool ride');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-32 bg-[#fdfdfd] min-h-screen font-body flex flex-col">
            <Navbar />
            
            <div className="w-full px-5 pt-8">
                <div className="mb-8 animate-slide-down">
                    <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">Create <span className="text-orange">Cab Pool</span></h2>
                    <p className="text-[#888] font-bold text-sm">Define your route, set seats, and share your ride.</p>
                </div>
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-[24px] mb-6 font-bold text-sm border border-red-100 shadow-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5 animate-fade-in">
                {/* Locations */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Start Location</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10">
                                <MapPin size={20} />
                            </div>
                            <input 
                                type="text"
                                className="w-full pl-14 pr-16 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                value={startQuery}
                                onChange={(e) => setStartQuery(e.target.value)}
                                placeholder="Enter start location"
                                required
                            />
                            <button type="button" onClick={() => handleSearch(startQuery, 'start')} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-[16px] flex items-center justify-center text-orange shadow-sm hover:scale-105 transition-transform active:scale-95">🔍</button>
                        </div>
                        {searchResults.type === 'start' && searchResults.results.length > 0 && (
                            <ul className="absolute z-50 w-[calc(100%-2rem)] bg-white border border-black/5 rounded-[24px] mt-1 max-h-40 overflow-y-auto shadow-2xl animate-slide-down p-2">
                                {searchResults.results.map((loc, i) => (
                                    <li key={i} className="p-4 hover:bg-orange/5 cursor-pointer font-bold text-sm rounded-xl transition-colors" onClick={() => selectLocation(loc, 'start')}>
                                        {loc.address}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">End Location</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10">
                                <Navigation size={20} />
                            </div>
                            <input 
                                type="text"
                                className="w-full pl-14 pr-16 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                value={endQuery}
                                onChange={(e) => setEndQuery(e.target.value)}
                                placeholder="Enter destination"
                                required
                            />
                            <button type="button" onClick={() => handleSearch(endQuery, 'end')} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-[16px] flex items-center justify-center text-orange shadow-sm hover:scale-105 transition-transform active:scale-95">🔍</button>
                        </div>
                        {searchResults.type === 'end' && searchResults.results.length > 0 && (
                            <ul className="absolute z-50 w-[calc(100%-2rem)] bg-white border border-black/5 rounded-[24px] mt-1 max-h-40 overflow-y-auto shadow-2xl animate-slide-down p-2">
                                {searchResults.results.map((loc, i) => (
                                    <li key={i} className="p-4 hover:bg-orange/5 cursor-pointer font-bold text-sm rounded-xl transition-colors" onClick={() => selectLocation(loc, 'end')}>
                                        {loc.address}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Date & Seats */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Start Time</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10 pointer-events-none">
                                <Calendar size={20} />
                            </div>
                            <input 
                                type="datetime-local" 
                                className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Available Seats</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10 pointer-events-none">
                                <Users size={20} />
                            </div>
                            <input 
                                type="number" 
                                min="1" max="8"
                                className="w-full pl-14 pr-6 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                                value={totalSeats}
                                onChange={(e) => setTotalSeats(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Cab Details */}
                <div className="pt-6 border-t border-black/5 space-y-4">
                    <h3 className="font-heading text-2xl text-black">Cab <span className="text-orange">Details</span></h3>
                    <div className="flex flex-col gap-4">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10 pointer-events-none"><Car size={18} /></div>
                            <input 
                                type="text" placeholder="Model (e.g. Swift)"
                                className="w-full pl-12 pr-4 py-4 bg-grayBg border border-transparent rounded-[20px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-sm text-black"
                                value={cabDetails.model}
                                onChange={(e) => setCabDetails({...cabDetails, model: e.target.value})}
                                required
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10 pointer-events-none"><Hash size={18} /></div>
                            <input 
                                type="text" placeholder="Plate Number"
                                className="w-full pl-12 pr-4 py-4 bg-grayBg border border-transparent rounded-[20px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-sm text-black uppercase"
                                value={cabDetails.number}
                                onChange={(e) => setCabDetails({...cabDetails, number: e.target.value})}
                                required
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10 pointer-events-none"><Palette size={18} /></div>
                            <input 
                                type="text" placeholder="Color"
                                className="w-full pl-12 pr-4 py-4 bg-grayBg border border-transparent rounded-[20px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-sm text-black"
                                value={cabDetails.color}
                                onChange={(e) => setCabDetails({...cabDetails, color: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-black text-white font-heading text-2xl py-5 rounded-[24px] shadow-2xl hover:bg-orange transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:shadow-none"
                >
                    {loading ? 'CREATING ROUTE...' : 'CREATE CAB POOL'}
                </button>
            </form>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default DriverCreatePoolRide;
