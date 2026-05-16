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
            const { latitude, longitude, heading, speed } = position.coords;
            setLocation({
                lat: latitude,
                lng: longitude,
                heading: heading || 0,
                speed: speed || 0,
                timestamp: position.timestamp
            });
        };

        const handleError = (error) => {
            setError(error.message);
        };

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
