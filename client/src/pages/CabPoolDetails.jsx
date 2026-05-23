import React, { useState } from 'react';
import CabPoolSearch from '../components/pool/CabPoolSearch';
import PoolCabCard from '../components/pool/PoolCabCard';
import PoolRouteMap from '../components/pool/PoolRouteMap';
import { searchPoolRides, joinPoolRide } from '../services/poolRideService';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

    import api from '../utils/api';
    
    const CabPoolDetails = () => {
        const [pools, setPools] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');
        const [searchParams, setSearchParams] = useState(null);
        const [selectedPool, setSelectedPool] = useState(null);
        const [joining, setJoining] = useState(false);
        const [currentUser, setCurrentUser] = useState(() => {
            try {
                return JSON.parse(localStorage.getItem('user')) || null;
            } catch {
                return null;
            }
        });
    
        const navigate = useNavigate();
        const location = useLocation();
        
        React.useEffect(() => {
            const fetchUserProfile = async () => {
                if (!currentUser) {
                    try {
                        const token = localStorage.getItem('token');
                        if (token) {
                            const res = await api.get('/auth/profile');
                            localStorage.setItem('user', JSON.stringify(res.data));
                            setCurrentUser(res.data);
                        }
                    } catch (err) {
                        console.error('Failed to load user profile', err);
                    }
                }
            };
            fetchUserProfile();
        }, [currentUser]);
    
    // The state passed from HomePage
    const initialState = location.state || null;

    const handleSearch = async (params) => {
        try {
            setLoading(true);
            setError('');
            setSearchParams(params);
            setSelectedPool(null);
            const response = await searchPoolRides(params);
            if (response.success) {
                setPools(response.results);
                if (response.results.length === 0) {
                    setError('No cab pools found for this route. Try adjusting your locations.');
                }
            }
        } catch (err) {
            setError(err.message || 'Error searching pool rides');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClick = (pool) => {
        setSelectedPool(pool);
    };

    const confirmJoin = async () => {
        if (!selectedPool) { alert('No pool selected'); return; }
        if (!searchParams) { alert('No search params'); return; }
        if (!currentUser) { alert('You must be logged in to join a pool ride!'); return; }
        
        try {
            setJoining(true);
            const joinData = {
                userId: currentUser._id || currentUser.id,
                pickup: searchParams.pickup,
                drop: searchParams.drop,
                requiredSeats: searchParams.requiredSeats,
                fare: selectedPool.fare.poolFare,
                approxPickupTime: selectedPool.timings.approxPickupTime,
                approxDropTime: selectedPool.timings.approxDropTime,
                pickupRouteIndex: selectedPool.match.pickupRouteIndex,
                dropRouteIndex: selectedPool.match.dropRouteIndex
            };

            const response = await joinPoolRide(selectedPool.poolRideId, joinData);
            if (response.success) {
                navigate(`/pool/track/${selectedPool.poolRideId}`);
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to join pool ride';
            setError(errorMsg);
            alert(`Error: ${errorMsg}`);
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="pb-32 bg-[#fdfdfd] min-h-screen font-body flex flex-col">
            <Navbar />
            
            <div className="w-full px-5 pt-8">
                <div className="mb-8 animate-slide-down">
                    <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">Cab <span className="text-orange">Pool</span></h2>
                    <p className="text-[#888] font-bold text-sm">Find shared rides, travel safe and save on your fare.</p>
                </div>
            
                <div className="flex flex-col gap-8">
                    {/* Search & Map */}
                    <div className="space-y-6">
                        <CabPoolSearch onSearch={handleSearch} initialState={initialState} />
                        
                        {searchParams && (
                            <PoolRouteMap 
                                pickup={searchParams.pickup}
                                drop={searchParams.drop}
                                routeCoordinates={selectedPool?.route?.coordinates}
                            />
                        )}
                    </div>

                    {/* Results */}
                    <div className="space-y-6">
                        {loading && (
                            <div className="text-center py-20 animate-pulse">
                                <div className="w-16 h-16 border-4 border-orange/20 border-t-orange rounded-full animate-spin mx-auto mb-4"></div>
                                <div className="font-heading text-2xl text-black">Searching <span className="text-orange">Pools...</span></div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 text-red-600 p-6 rounded-[24px] mb-4 font-bold text-sm border border-red-100 shadow-sm">
                                {error}
                            </div>
                        )}

                        {!loading && pools.length > 0 && !selectedPool && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-heading text-2xl text-black">Available <span className="text-orange">Pools</span></h2>
                                    <div className="bg-orange/10 text-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        {pools.length} Found
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {pools.map(pool => (
                                        <PoolCabCard key={pool.poolRideId} pool={pool} onJoin={handleJoinClick} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Join Confirmation View */}
                        {selectedPool && (
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-black/5 animate-slide-up relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                                
                                <button onClick={() => setSelectedPool(null)} className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-6 hover:text-orange transition-colors flex items-center gap-1">
                                    ← Back to results
                                </button>
                                <h2 className="font-heading text-3xl mb-8 text-black">Confirm Your <span className="text-green-500">Booking</span></h2>
                                
                                <div className="flex items-center gap-5 mb-8 p-4 bg-grayBg rounded-3xl border border-black/5">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black/20 font-heading text-2xl shadow-sm overflow-hidden">
                                        {selectedPool.driver.photo ? (
                                            <img src={selectedPool.driver.photo} alt={selectedPool.driver.name} className="w-full h-full object-cover" />
                                        ) : (
                                            selectedPool.driver.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Driver</div>
                                        <h4 className="font-heading text-2xl text-black leading-none">{selectedPool.driver.name}</h4>
                                        <div className="text-green-500 font-black text-xs mt-1">⭐ {selectedPool.driver.rating}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Cab</div>
                                        <div className="font-bold text-sm text-black uppercase">{selectedPool.cab.number}</div>
                                        <div className="text-xs text-[#888]">{selectedPool.cab.model}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-8 border-b border-black/5 pb-6">
                                    <div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Total Fare</div>
                                        <div className="font-heading text-4xl text-green-500">₹{selectedPool.fare.poolFare}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Seats</div>
                                        <div className="font-heading text-3xl text-black">{searchParams.requiredSeats}</div>
                                    </div>
                                </div>

                                <button 
                                    onClick={confirmJoin}
                                    disabled={joining}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-heading text-2xl py-5 rounded-[24px] shadow-2xl shadow-green-500/20 transition-all active:scale-[0.98] disabled:bg-gray-400 disabled:shadow-none"
                                >
                                    {joining ? 'CONFIRMING...' : 'CONFIRM & JOIN POOL'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 z-[100]">
                <BottomNav />
            </div>
        </div>
    );
};

export default CabPoolDetails;
