import { useEffect, useRef } from 'react';
import { socket } from '../utils/api';

const useSocket = (events = {}) => {
    const eventsRef = useRef(events);

    useEffect(() => {
        eventsRef.current = events;
    }, [events]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            socket.emit('join', userId);
        }

        const currentEvents = eventsRef.current;
        Object.keys(currentEvents).forEach(event => {
            socket.on(event, currentEvents[event]);
        });

        return () => {
            Object.keys(currentEvents).forEach(event => {
                socket.off(event, currentEvents[event]);
            });
        };
    }, []);

    const emit = (event, data) => {
        socket.emit(event, data);
    };

    return { socket, emit };
};

export default useSocket;
