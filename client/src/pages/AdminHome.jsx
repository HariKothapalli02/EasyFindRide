import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
    Users, 
    Car, 
    MapPin, 
    Star, 
    Mail, 
    Search, 
    LogOut, 
    Activity, 
    ArrowRight, 
    Clock, 
    Calendar, 
    Inbox, 
    Eye, 
    Compass, 
    AlertCircle, 
    ShieldAlert,
    ChevronRight,
    Map
} from 'lucide-react';
import api, { socket } from '../utils/api';
import CustomerRideMap from '../components/CustomerRideMap';
import { useNavigate } from 'react-router-dom';

const AdminHome = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data states
    const [riders, setRiders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection details
    const [selectedRider, setSelectedRider] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [trackingRide, setTrackingRide] = useState(null);
    
    // Search filters
    const [riderSearch, setRiderSearch] = useState('');
    const [driverSearch, setDriverSearch] = useState('');
    const [rideSearch, setRideSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            const [ridersRes, driversRes, bookingsRes, reviewsRes] = await Promise.all([
                api.get('/admin/users', { headers }),
                api.get('/admin/drivers', { headers }),
                api.get('/admin/bookings', { headers }),
                api.get('/admin/reviews', { headers })
            ]);

            setRiders(ridersRes.data);
            setDrivers(driversRes.data);
            setBookings(bookingsRes.data);
            setReviews(reviewsRes.data);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Setup polling for live updates
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Derived statistics
    const stats = {
        totalRides: bookings.length,
        liveRides: bookings.filter(b => ['accepted', 'picked-up', 'ongoing'].includes(b.status)).length,
        activeDrivers: drivers.filter(d => d.isOnline).length,
        totalReviews: reviews.length,
        avgDriverRating: drivers.length 
            ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) 
            : '4.5'
    };

    // Filter lists
    const filteredRiders = riders.filter(r => 
        r.name.toLowerCase().includes(riderSearch.toLowerCase()) ||
        r.email.toLowerCase().includes(riderSearch.toLowerCase()) ||
        r.phone.includes(riderSearch)
    );

    const filteredDrivers = drivers.filter(d => 
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.email.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.phone.includes(driverSearch) ||
        (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(driverSearch.toLowerCase()))
    );

    const filteredBookings = bookings.filter(b => 
        b.pickup.toLowerCase().includes(rideSearch.toLowerCase()) ||
        b.drop.toLowerCase().includes(rideSearch.toLowerCase()) ||
        b.status.toLowerCase().includes(rideSearch.toLowerCase()) ||
        (b.userId?.name && b.userId.name.toLowerCase().includes(rideSearch.toLowerCase())) ||
        (b.driverId?.name && b.driverId.name.toLowerCase().includes(rideSearch.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-grayBg font-body pb-28 lg:pb-12">
            <Navbar />
            
            {/* Header Area */}
            <div className="bg-black text-white px-8 py-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[30%] h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-orange rounded-full blur-[150px]" />
                </div>
                
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-orange/20 text-orange text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full mb-3 border border-orange/10">
                            <ShieldAlert size={12} className="animate-pulse" />
                            Admin Console
                        </div>
                        <h1 className="font-heading text-5xl tracking-tighter mb-2">EASYFIND<span className="text-orange">RIDE</span> CENTRAL</h1>
                        <p className="text-white/40 font-bold text-sm">Real-time system oversight, driver surveillance and ride tracking</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-4 rounded-[20px] font-heading text-lg tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 self-start md:self-center active:scale-95"
                    >
                        <LogOut size={18} />
                        SYSTEM LOGOUT
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
                {/* Stats Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-md shadow-black/5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange mb-4 shrink-0">
                            <Compass size={20} className="animate-spin-slow" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Live Rides</div>
                            <div className="font-heading text-4xl text-black">{stats.liveRides}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-md shadow-black/5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4 shrink-0">
                            <Activity size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Online Drivers</div>
                            <div className="font-heading text-4xl text-green-500">{stats.activeDrivers}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-md shadow-black/5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-600 mb-4 shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Riders</div>
                            <div className="font-heading text-4xl text-purple-600">{riders.length}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-md shadow-black/5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 mb-4 shrink-0">
                            <Car size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Total Rides</div>
                            <div className="font-heading text-4xl text-blue-600">{stats.totalRides}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-md shadow-black/5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 col-span-2 lg:col-span-1">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 mb-4 shrink-0">
                            <Star size={20} fill="currentColor" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Reviews & Rating</div>
                            <div className="font-heading text-4xl text-black">
                                {stats.avgDriverRating} <span className="text-sm font-black text-[#888]">({stats.totalReviews})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs Sidebar/Main Navigation */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Tab Navigation Menu (Desktop Sidebar) */}
                    <div className="hidden lg:flex w-[260px] bg-white rounded-3xl p-4 border border-black/5 shadow-sm shrink-0 flex-col gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'riders', label: 'Riders & Users', icon: Users },
                            { id: 'drivers', label: 'Drivers & Reviews', icon: Car },
                            { id: 'rides', label: 'Ride Tracker', icon: MapPin },
                            { id: 'mailbox', label: 'Mailbox', icon: Mail }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedRider(null);
                                    setSelectedDriver(null);
                                }}
                                className={`flex items-center gap-3.5 px-5 py-4 rounded-[20px] font-heading text-lg tracking-wide transition-all shrink-0 w-full ${
                                    activeTab === tab.id 
                                        ? 'bg-orange text-white shadow-lg shadow-orange/10' 
                                        : 'text-[#888] hover:bg-grayBg hover:text-black'
                                }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full min-h-[500px]">
                        {loading && (
                            <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-12 h-12 border-4 border-orange/10 border-t-orange rounded-full animate-spin mb-4" />
                                <div className="font-heading text-xl text-[#888]">Retrieving live metrics...</div>
                            </div>
                        )}

                        {!loading && activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Welcome Panel */}
                                <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] bg-orange/5 rounded-full blur-2xl" />
                                    <h2 className="font-heading text-3xl mb-2 text-black">System Status: <span className="text-green-500">OPTIMAL</span></h2>
                                    <p className="text-[#888] font-bold text-sm leading-relaxed max-w-xl">
                                        All microservices are active. Real-time dispatcher is monitoring proximity matching. Active drivers are broadcasting GPS beacons successfully.
                                    </p>
                                </div>

                                {/* Live and Recent Activity Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Active Drivers mini-list */}
                                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                                        <h3 className="font-heading text-xl mb-4 text-black flex items-center justify-between">
                                            Online Drivers
                                            <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                {stats.activeDrivers} active
                                            </span>
                                        </h3>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {drivers.filter(d => d.isOnline).length === 0 ? (
                                                <div className="text-center py-10 text-[#888] font-bold text-sm">No drivers currently online</div>
                                            ) : (
                                                drivers.filter(d => d.isOnline).map(driver => (
                                                    <div key={driver._id} className="flex items-center justify-between p-3 bg-grayBg rounded-2xl border border-black/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange font-heading text-lg">
                                                                {driver.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-black">{driver.name}</div>
                                                                <div className="text-[10px] font-black text-[#888] uppercase">{driver.vehicleType} • {driver.vehicleNumber}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-orange">
                                                            <Star size={12} fill="currentColor" />
                                                            {driver.rating || '4.5'}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Bookings mini-feed */}
                                    <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                                        <h3 className="font-heading text-xl mb-4 text-black">Recent Bookings</h3>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {bookings.slice(0, 5).map(booking => (
                                                <div key={booking._id} className="p-3 bg-grayBg rounded-2xl border border-black/5 flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-black text-xs text-black">{booking.userId?.name || 'Rider'}</span>
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                                                booking.status === 'completed' ? 'text-green-500 bg-green-500/10' :
                                                                booking.status === 'cancelled' ? 'text-red-500 bg-red-500/10' :
                                                                'text-orange bg-orange/10'
                                                            }`}>{booking.status}</span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-[#888] line-clamp-1">{booking.pickup} → {booking.drop}</div>
                                                    </div>
                                                    <div className="font-heading text-lg text-orange shrink-0 ml-3">₹{booking.price}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RIDERS TAB */}
                        {!loading && activeTab === 'riders' && (
                            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm min-h-[500px]">
                                {!selectedRider ? (
                                    <>
                                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                            <h2 className="font-heading text-2xl text-black">Riders & Customers</h2>
                                            <div className="relative w-full max-w-[280px]">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search riders..." 
                                                    value={riderSearch}
                                                    onChange={(e) => setRiderSearch(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-grayBg rounded-2xl outline-none focus:bg-white border border-transparent focus:border-black/5 font-bold text-sm text-black transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {filteredRiders.length === 0 ? (
                                                <div className="text-center py-20 text-[#888] font-bold">No riders matched your query</div>
                                            ) : (
                                                filteredRiders.map(rider => {
                                                    const riderRides = bookings.filter(b => b.userId?._id === rider._id);
                                                    return (
                                                        <div 
                                                            key={rider._id} 
                                                            onClick={() => setSelectedRider(rider)}
                                                            className="flex items-center justify-between p-4 bg-grayBg hover:bg-orange/5 hover:border-orange/20 border border-transparent rounded-[24px] cursor-pointer transition-all active:scale-[0.99] group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-600 font-heading text-2xl">
                                                                    {rider.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-black group-hover:text-orange transition-colors">{rider.name}</div>
                                                                    <div className="text-xs font-bold text-[#888]">{rider.phone} • {rider.email}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <div className="font-heading text-lg text-black">{riderRides.length} Rides</div>
                                                                    <div className="text-[9px] font-black text-[#aaa] uppercase">Registered: {new Date(rider.createdAt).toLocaleDateString()}</div>
                                                                </div>
                                                                <ChevronRight size={18} className="text-[#bbb] group-hover:text-orange group-hover:translate-x-1 transition-all" />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Individual Rider Specific Rides Detail View */
                                    <div className="space-y-6 animate-fade-in">
                                        <button 
                                            onClick={() => setSelectedRider(null)}
                                            className="inline-flex items-center gap-2 bg-grayBg hover:bg-black hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#888] transition-all"
                                        >
                                            ← Back to list
                                        </button>

                                        <div className="flex items-center gap-4 p-5 bg-purple-600/5 rounded-3xl border border-purple-600/10">
                                            <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-heading text-4xl shadow-md">
                                                {selectedRider.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-[#888] uppercase tracking-wider mb-0.5">Rider Details</div>
                                                <h3 className="font-heading text-3xl leading-none text-black mb-1">{selectedRider.name}</h3>
                                                <div className="text-xs font-bold text-purple-600">{selectedRider.phone} • {selectedRider.email} • Hyderabad</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-heading text-xl mb-4 text-black">Booking History ({bookings.filter(b => b.userId?._id === selectedRider._id).length})</h3>
                                            <div className="space-y-4">
                                                {bookings.filter(b => b.userId?._id === selectedRider._id).length === 0 ? (
                                                    <div className="text-center py-10 bg-grayBg rounded-2xl text-[#888] font-bold">This rider has not booked any rides yet</div>
                                                ) : (
                                                    bookings.filter(b => b.userId?._id === selectedRider._id).map((b, idx) => (
                                                        <div key={idx} className="bg-grayBg p-5 rounded-[24px] border border-black/5 shadow-sm">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center text-orange font-black">
                                                                        {b.vehicleType.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-sm text-black">{b.vehicleType} Ride</div>
                                                                        <div className="text-[10px] font-bold text-[#aaa]">{new Date(b.date).toLocaleString()}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-heading text-xl text-orange">₹{b.price}</div>
                                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                                                        b.status === 'completed' ? 'text-green-500 bg-green-500/10' :
                                                                        b.status === 'cancelled' ? 'text-red-500 bg-red-500/10' :
                                                                        'text-orange bg-orange/10'
                                                                    }`}>{b.status}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 relative border-t border-black/5 pt-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                                    <div className="text-xs font-bold text-black line-clamp-1">{b.pickup}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                                                                    <div className="text-xs font-bold text-black line-clamp-1">{b.drop}</div>
                                                                </div>
                                                            </div>
                                                            {b.driverId && (
                                                                <div className="mt-3 pt-3 border-t border-dashed border-black/5 flex items-center gap-2 text-[10px] font-bold text-[#888]">
                                                                    <span>Driver Assigned: <strong className="text-black">{b.driverId.name}</strong> ({b.driverId.vehicleNumber})</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DRIVERS TAB */}
                        {!loading && activeTab === 'drivers' && (
                            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm min-h-[500px]">
                                {!selectedDriver ? (
                                    <>
                                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                            <h2 className="font-heading text-2xl text-black">Drivers</h2>
                                            <div className="relative w-full max-w-[280px]">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search drivers..." 
                                                    value={driverSearch}
                                                    onChange={(e) => setDriverSearch(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-grayBg rounded-2xl outline-none focus:bg-white border border-transparent focus:border-black/5 font-bold text-sm text-black transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {filteredDrivers.length === 0 ? (
                                                <div className="text-center py-20 text-[#888] font-bold">No drivers matched your query</div>
                                            ) : (
                                                filteredDrivers.map(driver => {
                                                    const driverReviews = reviews.filter(r => r.driverId?._id === driver._id);
                                                    return (
                                                        <div 
                                                            key={driver._id} 
                                                            onClick={() => setSelectedDriver(driver)}
                                                            className="flex items-center justify-between p-4 bg-grayBg hover:bg-orange/5 hover:border-orange/20 border border-transparent rounded-[24px] cursor-pointer transition-all active:scale-[0.99] group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <div className="w-12 h-12 bg-orange/10 rounded-2xl flex items-center justify-center text-orange font-heading text-2xl">
                                                                        {driver.name.charAt(0)}
                                                                    </div>
                                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${driver.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-black group-hover:text-orange transition-colors flex items-center gap-2">
                                                                        {driver.name}
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${driver.isOnline ? 'text-green-600 bg-green-500/10' : 'text-[#888] bg-black/5'}`}>
                                                                            {driver.isOnline ? 'Online' : 'Offline'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs font-bold text-[#888]">{driver.phone} • {driver.vehicleType} ({driver.vehicleNumber || 'No plate'})</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <div className="flex items-center justify-end gap-1.5 text-orange font-black text-sm">
                                                                        <Star size={14} fill="currentColor" />
                                                                        {driver.rating || '4.5'}
                                                                    </div>
                                                                    <div className="text-[9px] font-black text-[#aaa] uppercase">{driverReviews.length} Reviews</div>
                                                                </div>
                                                                <ChevronRight size={18} className="text-[#bbb] group-hover:text-orange group-hover:translate-x-1 transition-all" />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Individual Driver Specific Profile & Review View */
                                    <div className="space-y-6 animate-fade-in">
                                        <button 
                                            onClick={() => setSelectedDriver(null)}
                                            className="inline-flex items-center gap-2 bg-grayBg hover:bg-black hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#888] transition-all"
                                        >
                                            ← Back to list
                                        </button>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-orange/5 rounded-3xl border border-orange/10">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-orange text-white rounded-2xl flex items-center justify-center font-heading text-4xl shadow-md">
                                                        {selectedDriver.name.charAt(0)}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${selectedDriver.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-black text-[#888] uppercase tracking-wider mb-0.5">Driver Profile</div>
                                                    <h3 className="font-heading text-3xl leading-none text-black mb-1 flex items-center gap-3">
                                                        {selectedDriver.name}
                                                    </h3>
                                                    <div className="text-xs font-bold text-orange">{selectedDriver.phone} • {selectedDriver.email}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white/80 border border-orange/10 px-5 py-3 rounded-2xl text-center self-start sm:self-center">
                                                <div className="text-[9px] font-black text-[#aaa] uppercase tracking-wider mb-0.5">Average Rating</div>
                                                <div className="flex items-center gap-1.5 justify-center font-heading text-3xl text-orange">
                                                    <Star size={20} fill="currentColor" />
                                                    {selectedDriver.rating || '4.5'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Vehicle details */}
                                            <div className="bg-grayBg p-5 rounded-[24px] border border-black/5">
                                                <h4 className="font-heading text-lg text-black mb-3">Vehicle Specifications</h4>
                                                <div className="space-y-2 text-sm font-bold">
                                                    <div className="flex justify-between border-b border-black/5 pb-2">
                                                        <span className="text-[#888]">Vehicle Type</span>
                                                        <span className="text-black">{selectedDriver.vehicleType || '----'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-black/5 pb-2">
                                                        <span className="text-[#888]">License Plate</span>
                                                        <span className="text-black uppercase">{selectedDriver.vehicleNumber || '----'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-black/5 pb-2">
                                                        <span className="text-[#888]">Current City</span>
                                                        <span className="text-black capitalize">{selectedDriver.city || 'Hyderabad'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[#888]">GPS Status</span>
                                                        <span className={selectedDriver.isOnline ? 'text-green-500' : 'text-[#888]'}>
                                                            {selectedDriver.isOnline ? 'Broadcasting live' : 'Offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Driver reviews */}
                                            <div className="bg-grayBg p-5 rounded-[24px] border border-black/5">
                                                <h4 className="font-heading text-lg text-black mb-3">Reviews & Ratings ({reviews.filter(r => r.driverId?._id === selectedDriver._id).length})</h4>
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {reviews.filter(r => r.driverId?._id === selectedDriver._id).length === 0 ? (
                                                        <div className="text-center py-10 text-[#888] font-bold text-sm">No reviews submitted for this driver yet</div>
                                                    ) : (
                                                        reviews.filter(r => r.driverId?._id === selectedDriver._id).map((rev, index) => (
                                                            <div key={index} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <div className="font-black text-xs text-black">{rev.userId?.name || 'Anonymous Rider'}</div>
                                                                        <div className="text-[8px] font-bold text-[#bbb]">{new Date(rev.createdAt).toLocaleDateString()}</div>
                                                                    </div>
                                                                    <div className="flex items-center gap-0.5 text-xs font-black text-orange bg-orange/5 px-2 py-0.5 rounded-full border border-orange/10">
                                                                        <Star size={10} fill="currentColor" />
                                                                        {rev.rating}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs font-bold text-[#666] leading-relaxed italic">
                                                                    "{rev.comment || 'No written comment.'}"
                                                                </p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* RIDE TRACKER TAB */}
                        {!loading && activeTab === 'rides' && (
                            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm min-h-[500px]">
                                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                    <div>
                                        <h2 className="font-heading text-2xl text-black">Ride Tracking Dispatch</h2>
                                        <p className="text-[10px] font-black text-[#888] uppercase tracking-wider">Monitor all live, completed or pending rides</p>
                                    </div>
                                    <div className="relative w-full max-w-[280px]">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
                                        <input 
                                            type="text" 
                                            placeholder="Search rides by location, status, names..." 
                                            value={rideSearch}
                                            onChange={(e) => setRideSearch(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-grayBg rounded-2xl outline-none focus:bg-white border border-transparent focus:border-black/5 font-bold text-sm text-black transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {filteredBookings.length === 0 ? (
                                        <div className="text-center py-20 text-[#888] font-bold">No rides match your current search query</div>
                                    ) : (
                                        filteredBookings.map((b, idx) => {
                                            const isActive = ['accepted', 'picked-up', 'ongoing'].includes(b.status);
                                            return (
                                                <div key={idx} className="bg-grayBg p-5 rounded-[28px] border border-black/5 hover:border-black/10 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange font-heading text-xl uppercase">
                                                                {b.vehicleType.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-black text-black">{b.vehicleType} Ride</span>
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                                        b.status === 'completed' ? 'text-green-500 bg-green-500/10' :
                                                                        b.status === 'cancelled' ? 'text-red-500 bg-red-500/10' :
                                                                        'text-orange bg-orange/10 animate-pulse'
                                                                    }`}>{b.status}</span>
                                                                </div>
                                                                <div className="text-[10px] font-bold text-[#aaa]">{new Date(b.date).toLocaleString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 relative border-t border-black/5 pt-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                                <div className="text-xs font-bold text-black line-clamp-1"><strong>Pickup:</strong> {b.pickup}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                                                                <div className="text-xs font-bold text-black line-clamp-1"><strong>Drop:</strong> {b.drop}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-4 text-[10px] font-black text-black/50 uppercase tracking-wider pt-1">
                                                            <div>Rider: <strong className="text-black font-extrabold">{b.userId?.name || 'Rider Deleted'}</strong></div>
                                                            {b.driverId && <div>Driver: <strong className="text-black font-extrabold">{b.driverId.name || 'Unassigned'}</strong></div>}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-black/5 pt-4 md:pt-0 shrink-0">
                                                        <div className="text-left md:text-right shrink-0">
                                                            <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Fare Price</div>
                                                            <div className="font-heading text-3xl text-orange leading-none">₹{b.price}</div>
                                                        </div>
                                                        
                                                        {isActive && (
                                                            <button 
                                                                onClick={() => setTrackingRide(b)}
                                                                className="bg-black text-white hover:bg-orange px-5 py-3 rounded-2xl font-heading text-sm tracking-wider shadow-lg hover:shadow-orange/20 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                                                            >
                                                                <Map size={14} />
                                                                TRACK LIVE
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MAILBOX TAB */}
                        {!loading && activeTab === 'mailbox' && (
                            <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm min-h-[500px] flex flex-col">
                                <div className="border-b border-black/5 pb-5 mb-8">
                                    <h2 className="font-heading text-2xl text-black">Inbox Mailbox</h2>
                                    <p className="text-[10px] font-black text-[#888] uppercase tracking-wider">Official administrative notifications and messages</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-24 h-24 bg-purple-600/5 text-purple-600 rounded-[32px] border-2 border-purple-600/10 flex items-center justify-center mb-6 shadow-sm">
                                        <Inbox size={44} className="opacity-40 animate-pulse" />
                                    </div>
                                    <h3 className="font-heading text-3xl text-black mb-2">Mailbox is Empty</h3>
                                    <p className="text-[#888] font-bold text-sm leading-relaxed max-w-sm">
                                        No administrative warnings or messages found. Everything is clear in your system logs.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIVE RIDE TRACKING OVERLAY MAP MODAL */}
            {trackingRide && (
                <div className="fixed inset-0 z-[10005] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-[650px] shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-slide-up relative">
                        {/* Header Details */}
                        <div className="bg-black text-white p-6 flex justify-between items-center shrink-0 border-b border-white/5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 bg-orange/20 text-orange px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5 border border-orange/10">
                                    <Compass size={10} className="animate-spin-slow" />
                                    Live Tracker Map
                                </div>
                                <h3 className="font-heading text-2xl leading-none text-white flex items-center gap-2">
                                    Tracking Ride ID: {trackingRide._id.substring(0, 8)}...
                                </h3>
                            </div>
                            
                            <button 
                                onClick={() => setTrackingRide(null)}
                                className="bg-white/10 hover:bg-white hover:text-black transition-all w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>

                        {/* MAP FRAME */}
                        <div className="flex-1 relative overflow-hidden bg-gray-100">
                            <CustomerRideMap ride={trackingRide} />
                            
                            <div className="absolute top-4 left-4 z-[1000]">
                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-xl flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-orange rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                        GPS broadcast: Active ({trackingRide.status})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Driver & Booking stats */}
                        <div className="bg-grayBg p-6 shrink-0 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange text-white rounded-2xl flex items-center justify-center font-heading text-2xl shadow-md">
                                    {trackingRide.driverId?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="font-black text-black leading-none mb-1">{trackingRide.driverId?.name || 'Driver Assigned'}</div>
                                    <div className="text-[10px] font-black text-orange uppercase tracking-wider">{trackingRide.driverId?.vehicleNumber || '----'}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-[#888] uppercase tracking-wider">Fare Price</div>
                                <div className="font-heading text-3xl text-orange">₹{trackingRide.price}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[75px] z-[99999] flex bg-white/95 backdrop-blur-[20px] border-t border-black/5 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'riders', label: 'Riders', icon: Users },
                    { id: 'drivers', label: 'Drivers', icon: Car },
                    { id: 'rides', label: 'Tracker', icon: MapPin },
                    { id: 'mailbox', label: 'Mailbox', icon: Mail }
                ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSelectedRider(null);
                                setSelectedDriver(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                                isActive ? 'text-orange translate-y-[-2px]' : 'text-[#aaa]'
                            }`}
                        >
                            <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-orange/10 scale-110' : 'bg-transparent'}`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wider transition-all ${
                                isActive ? 'opacity-100 scale-100' : 'opacity-65 scale-90'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminHome;
