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

        const handlers = {};
        Object.keys(eventsRef.current).forEach(event => {
            handlers[event] = (data) => {
                if (eventsRef.current[event]) {
                    eventsRef.current[event](data);
                }
            };
            socket.on(event, handlers[event]);
        });

        return () => {
            Object.keys(handlers).forEach(event => {
                socket.off(event, handlers[event]);
            });
        };
    }, []);

    const emit = (event, data) => {
        socket.emit(event, data);
    };

    return { socket, emit };
};

export default useSocket;
