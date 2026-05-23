import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPoolRideDetails, updatePassengerStatus } from '../services/poolRideService';
import { usePoolRideSocket } from '../hooks/usePoolRideSocket';
import PoolRouteMap from '../components/pool/PoolRouteMap';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const CabPoolTracking = () => {
    const { poolRideId } = useParams();
    const [pool, setPool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const user = JSON.parse(localStorage.getItem('user'));
    const isDriver = pool?.driverId?._id === user?._id;

    // Use custom socket hook
    const { driverLocation, passengerUpdates, emitDriverLocation } = usePoolRideSocket(poolRideId);

    const fetchPoolDetails = async () => {
        try {
            const response = await getPoolRideDetails(poolRideId);
            if (response.success) {
                setPool(response.poolRide);
            }
        } catch (err) {
            setError('Failed to load pool details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoolDetails();
        // eslint-disable-next-line
    }, [poolRideId, passengerUpdates]); // Re-fetch if passengers update

    // Mock driver movement if driver (in a real app, use Geolocation API)
    useEffect(() => {
        if (isDriver && pool?.route?.coordinates) {
            let index = 0;
            const interval = setInterval(() => {
                if (index < pool.route.coordinates.length) {
                    const coord = pool.route.coordinates[index];
                    emitDriverLocation(user._id, coord[1], coord[0]); // coord is [lng, lat]
                    index += 5; // skip some points for faster simulation
                } else {
                    clearInterval(interval);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isDriver, pool, emitDriverLocation, user]);

    const handlePassengerStatus = async (passengerId, status) => {
        try {
            await updatePassengerStatus(poolRideId, passengerId, status);
            fetchPoolDetails(); // refresh
        } catch (err) {
            alert(err.message || 'Error updating status');
        }
    };

    if (loading) return <div className="text-center mt-20">Loading Tracking Info...</div>;
    if (error || !pool) return <div className="text-center mt-20 text-red-500">{error}</div>;

    // Determine what to show on map for passenger
    let passengerPickup = null;
    let passengerDrop = null;
    if (!isDriver) {
        const myBooking = pool.passengers.find(p => p.userId === user?._id);
        if (myBooking) {
            passengerPickup = myBooking.pickup;
            passengerDrop = myBooking.drop;
        }
    }

    const currentLoc = driverLocation || pool.driverCurrentLocation || pool.startLocation;

    return (
        <div className="pb-32 bg-[#fdfdfd] min-h-screen font-body flex flex-col">
            <Navbar />
            
            <div className="w-full px-5 pt-8">
                <div className="mb-8 animate-slide-down">
                    <h2 className="font-heading text-4xl text-black uppercase tracking-tighter">
                        {isDriver ? 'Driver Dashboard: ' : 'Track Your '}
                        <span className="text-orange">Cab Pool</span>
                    </h2>
                    <p className="text-[#888] font-bold text-sm">Real-time status and tracking for your shared ride.</p>
                </div>

                <div className="mb-8 animate-fade-in relative z-0">
                <PoolRouteMap 
                    routeCoordinates={pool.route.coordinates}
                    driverLocation={currentLoc}
                    pickup={isDriver ? pool.startLocation : passengerPickup}
                    drop={isDriver ? pool.endLocation : passengerDrop}
                />
            </div>

            <div className="flex flex-col gap-6 relative z-10 animate-slide-up">
                {/* Details Card */}
                <div className="bg-white p-8 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5">
                    <h2 className="font-heading text-2xl text-black mb-6">Ride <span className="text-orange">Info</span></h2>
                    
                    <div className="space-y-4 mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">From</span>
                            <span className="font-bold text-sm text-black">{pool.startLocation.address}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">To</span>
                            <span className="font-bold text-sm text-black">{pool.endLocation.address}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">Status</span>
                            <div>
                                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">{pool.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    {!isDriver && pool.driverId && (
                        <div className="mt-6 pt-6 border-t border-black/5 flex items-center gap-4 bg-grayBg p-4 rounded-3xl">
                            <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center overflow-hidden">
                                {pool.driverId.photo ? (
                                    <img src={pool.driverId.photo} alt="Driver" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-heading text-2xl text-black/20">{pool.driverId.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-0.5">Your Driver</div>
                                <p className="font-heading text-2xl text-black leading-none mb-1">{pool.driverId.name}</p>
                                <p className="text-[10px] font-bold text-[#888]">{pool.cabDetails.model} ({pool.cabDetails.number})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Passengers Card */}
                <div className="bg-white p-8 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-heading text-2xl text-black">Passengers</h2>
                        <span className="bg-orange/10 text-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{pool.availableSeats} seats left</span>
                    </div>

                    {pool.passengers.length === 0 ? (
                        <div className="bg-grayBg p-6 rounded-3xl text-center">
                            <p className="text-[#888] font-bold text-sm">No passengers have joined yet.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {pool.passengers.map(p => (
                                <li key={p._id} className="bg-grayBg p-5 rounded-[24px] border border-black/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-orange/30 transition-colors">
                                    <div>
                                        <p className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-2">Seats: {p.requiredSeats}</p>
                                        <div className="space-y-1 mb-2">
                                            <p className="text-xs text-black font-medium line-clamp-1"><span className="text-green-500 font-black mr-1">P:</span> {p.pickup.address}</p>
                                            <p className="text-xs text-black font-medium line-clamp-1"><span className="text-red-500 font-black mr-1">D:</span> {p.drop.address}</p>
                                        </div>
                                        <div className="inline-block px-2 py-0.5 bg-white rounded-full border border-black/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{p.status}</span>
                                        </div>
                                    </div>
                                    
                                    {isDriver && (p.status === 'booked' || p.status === 'picked') && (
                                        <div className="flex gap-2">
                                            {p.status === 'booked' && (
                                                <button 
                                                    onClick={() => handlePassengerStatus(p._id, 'picked')}
                                                    className="bg-black text-white font-heading text-sm px-4 py-2 rounded-xl hover:bg-orange transition-colors active:scale-95"
                                                >
                                                    PICKED
                                                </button>
                                            )}
                                            {p.status === 'picked' && (
                                                <button 
                                                    onClick={() => handlePassengerStatus(p._id, 'dropped')}
                                                    className="bg-green-500 text-white font-heading text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors active:scale-95 shadow-lg shadow-green-500/20"
                                                >
                                                    DROPPED
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
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

export default CabPoolTracking;
