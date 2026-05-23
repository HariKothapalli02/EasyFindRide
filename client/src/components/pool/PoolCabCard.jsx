import React from 'react';

const PoolCabCard = ({ pool, onJoin }) => {
    const { driver, cab, timings, seats, fare } = pool;

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm hover:border-green-500/20 hover:shadow-md transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6 border-b border-black/5 pb-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-grayBg rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                        {driver.photo ? (
                            <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-heading text-2xl text-black/20">{driver.name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-heading text-2xl text-black leading-none mb-1">{driver.name}</h3>
                        <div className="text-[10px] font-black text-orange uppercase tracking-widest flex items-center gap-1">
                            ⭐ {driver.rating}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-heading text-3xl text-green-500 leading-none mb-1">₹{fare.poolFare}</div>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-black/30 line-through">₹{fare.normalCabFare}</span>
                        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{fare.discountPercent}% OFF</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-6 bg-grayBg p-4 rounded-2xl">
                <div className="flex-1 border-r border-black/5">
                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Cab Details</div>
                    <div className="font-bold text-sm text-black">{cab.model}</div>
                    <div className="text-[11px] font-semibold text-[#888] mt-0.5">{cab.color} • {cab.number}</div>
                </div>
                <div className="flex-1 pl-2">
                    <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-1">Seats Available</div>
                    <div className="font-heading text-xl text-black leading-none mb-1">{seats.availableSeats} <span className="text-sm text-black/40">/ {seats.totalSeats}</span></div>
                    <div className="text-[10px] font-bold text-orange">{seats.bookedPassengers} joined</div>
                </div>
            </div>

            <div className="space-y-3 mb-6 px-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">Approx Pickup</span>
                    </div>
                    <span className="font-bold text-sm text-black">{formatTime(timings.approxPickupTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange" />
                        <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">Approx Drop</span>
                    </div>
                    <span className="font-bold text-sm text-black">{formatTime(timings.approxDropTime)}</span>
                </div>
            </div>

            <button 
                onClick={() => onJoin(pool)}
                className="w-full bg-black text-white font-heading text-xl py-4 rounded-[20px] group-hover:bg-green-500 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
            >
                JOIN POOL
            </button>
        </div>
    );
};

export default PoolCabCard;
