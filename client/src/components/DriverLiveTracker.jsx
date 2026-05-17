import React, { useEffect, useRef } from 'react';
import useLiveLocation from '../hooks/useLiveLocation';
import api, { socket } from '../utils/api';

const DriverLiveTracker = ({ rideId, isOnline }) => {
    const { location, error } = useLiveLocation();
    const lastUpdateRef = useRef(0);
    const lastApiUpdateRef = useRef(0);

    useEffect(() => {
        if (location && isOnline) {
            const now = Date.now();
            // Throttling: Send socket update every 3 seconds for real-time smoothness
            if (now - lastUpdateRef.current > 3000) {
                const driverId = localStorage.getItem('userId');
                
                const updateData = {
                    ...location,
                    driverId,
                    rideId,
                    isOnline
                };

                // 1. Send via Socket for real-time tracking
                socket.emit('driver:location:update', updateData);
                lastUpdateRef.current = now;

                // 2. Send via API for DB persistence (throttle to 30s to reduce DB load)
                if (now - lastApiUpdateRef.current > 30000) {
                    api.post('/rides/location', updateData).catch(err => console.error('API location update error:', err));
                    lastApiUpdateRef.current = now;
                }
            }
        }
    }, [location, isOnline, rideId]);

    if (error) {
        console.error('Geolocation Error:', error);
    }

    return null; // Invisible component
};

export default DriverLiveTracker;
