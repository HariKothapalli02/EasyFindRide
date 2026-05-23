import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

export const usePoolRideSocket = (poolRideId) => {
    const [socket, setSocket] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [passengerUpdates, setPassengerUpdates] = useState(null);

    useEffect(() => {
        if (!poolRideId) return;

        const newSocket = io(SOCKET_URL);
        
        newSocket.on('connect', () => {
            newSocket.emit('poolRide:join', poolRideId);
        });

        newSocket.on('poolRide:driverLocation', (data) => {
            setDriverLocation(data);
        });

        newSocket.on('poolRide:passengerJoined', (data) => {
            setPassengerUpdates(data);
        });

        newSocket.on('poolRide:passengerStatusUpdated', (data) => {
            setPassengerUpdates(data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [poolRideId]);

    const emitDriverLocation = (driverId, lat, lng) => {
        if (socket) {
            socket.emit('poolRide:location:update', {
                poolRideId,
                driverId,
                lat,
                lng
            });
        }
    };

    return { socket, driverLocation, passengerUpdates, emitDriverLocation };
};
