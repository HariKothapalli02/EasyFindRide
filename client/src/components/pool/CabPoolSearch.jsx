import React, { useState } from 'react';
import { searchLocation } from '../../services/locationSearchService';
import { MapPin, Navigation, Search, Users, ChevronDown } from 'lucide-react';

const CabPoolSearch = ({ onSearch, initialState }) => {
    const [pickupQuery, setPickupQuery] = useState(initialState?.pickup || '');
    const [dropQuery, setDropQuery] = useState(initialState?.drop || '');
    const [pickupLocation, setPickupLocation] = useState(
        initialState?.pickupCoords ? { address: initialState.pickup, lat: initialState.pickupCoords.lat, lng: initialState.pickupCoords.lng } : null
    );
    const [dropLocation, setDropLocation] = useState(
        initialState?.dropCoords ? { address: initialState.drop, lat: initialState.dropCoords.lat, lng: initialState.dropCoords.lng } : null
    );
    const [seats, setSeats] = useState(1);
    
    const [searchResults, setSearchResults] = useState({ type: null, results: [] });

    React.useEffect(() => {
        if (initialState?.pickupCoords && initialState?.dropCoords) {
            onSearch({ 
                pickup: { address: initialState.pickup, lat: initialState.pickupCoords.lat, lng: initialState.pickupCoords.lng }, 
                drop: { address: initialState.drop, lat: initialState.dropCoords.lat, lng: initialState.dropCoords.lng }, 
                requiredSeats: 1 
            });
        }
        // eslint-disable-next-line
    }, []);

    const handleSearchLoc = async (query, type) => {
        if (!query) return;
        const results = await searchLocation(query);
        setSearchResults({ type, results });
    };

    const selectLocation = (loc, type) => {
        if (type === 'pickup') {
            setPickupLocation(loc);
            setPickupQuery(loc.address);
        } else {
            setDropLocation(loc);
            setDropQuery(loc.address);
        }
        setSearchResults({ type: null, results: [] });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (pickupLocation && dropLocation) {
            onSearch({ pickup: pickupLocation, drop: dropLocation, requiredSeats: Number(seats) });
        } else {
            alert('Please select valid pickup and drop locations from the search results.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5 animate-fade-in">
            <h2 className="font-heading text-3xl mb-6 text-black">Search <span className="text-orange">Cab Pool</span></h2>
            <form onSubmit={handleSearch} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Pickup Location</label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10">
                            <MapPin size={20} />
                        </div>
                        <input 
                            type="text"
                            className="w-full pl-14 pr-16 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                            value={pickupQuery}
                            onChange={(e) => setPickupQuery(e.target.value)}
                            placeholder="Enter pickup location"
                            required
                        />
                        <button type="button" onClick={() => handleSearchLoc(pickupQuery, 'pickup')} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-[16px] flex items-center justify-center text-orange shadow-sm hover:scale-105 transition-transform active:scale-95"><Search size={18} /></button>
                    </div>
                    {searchResults.type === 'pickup' && searchResults.results.length > 0 && (
                        <ul className="absolute z-50 w-[calc(100%-2rem)] bg-white border border-black/5 rounded-[24px] mt-1 max-h-40 overflow-y-auto shadow-2xl animate-slide-down p-2">
                            {searchResults.results.map((loc, i) => (
                                <li key={i} className="p-4 hover:bg-orange/5 cursor-pointer font-bold text-sm rounded-xl transition-colors" onClick={() => selectLocation(loc, 'pickup')}>
                                    {loc.address}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Drop Location</label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors z-10">
                            <Navigation size={20} />
                        </div>
                        <input 
                            type="text"
                            className="w-full pl-14 pr-16 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black"
                            value={dropQuery}
                            onChange={(e) => setDropQuery(e.target.value)}
                            placeholder="Enter drop location"
                            required
                        />
                        <button type="button" onClick={() => handleSearchLoc(dropQuery, 'drop')} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-[16px] flex items-center justify-center text-orange shadow-sm hover:scale-105 transition-transform active:scale-95"><Search size={18} /></button>
                    </div>
                    {searchResults.type === 'drop' && searchResults.results.length > 0 && (
                        <ul className="absolute z-50 w-[calc(100%-2rem)] bg-white border border-black/5 rounded-[24px] mt-1 max-h-40 overflow-y-auto shadow-2xl animate-slide-down p-2">
                            {searchResults.results.map((loc, i) => (
                                <li key={i} className="p-4 hover:bg-orange/5 cursor-pointer font-bold text-sm rounded-xl transition-colors" onClick={() => selectLocation(loc, 'drop')}>
                                    {loc.address}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Required Seats</label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ccc] group-focus-within:text-orange transition-colors pointer-events-none">
                            <Users size={20} />
                        </div>
                        <select 
                            className="w-full pl-14 pr-12 py-5 bg-grayBg border border-transparent rounded-[24px] outline-none focus:border-orange/20 focus:bg-white transition-all font-bold text-black appearance-none"
                            value={seats}
                            onChange={(e) => setSeats(e.target.value)}
                        >
                            {[1,2,3,4].map(n => <option key={n} value={n}>{n} Seat{n > 1 ? 's' : ''}</option>)}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#ccc] pointer-events-none">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-black text-white font-heading text-2xl py-5 rounded-[24px] shadow-2xl hover:bg-orange transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-3 group"
                >
                    FIND POOLS
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-orange transition-colors">
                        <Search size={14} strokeWidth={3} />
                    </div>
                </button>
            </form>
        </div>
    );
};

export default CabPoolSearch;
