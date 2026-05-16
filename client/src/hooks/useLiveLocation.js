import { useState, useEffect, useRef } from 'react';

const useLiveLocation = (options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const watchId = useRef(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const handleSuccess = (position) => {
            const { latitude, longitude, heading, speed, accuracy } = position.coords;
            
            // Only update if accuracy is better than 100 meters or if we don't have a location yet
            // This prevents "wrong" (cached/low-precision) locations from being used.
            if (accuracy < 100 || !location) {
                setLocation({
                    lat: latitude,
                    lng: longitude,
                    heading: heading || 0,
                    speed: speed || 0,
                    accuracy: accuracy,
                    timestamp: position.timestamp
                });
            }
        };

        const handleError = (error) => {
            setError(error.message);
        };

        // Prime the geolocation to get a fresh fix
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

        watchId.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            options
        );

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, []);

    return { location, error };
};

export default useLiveLocation;
