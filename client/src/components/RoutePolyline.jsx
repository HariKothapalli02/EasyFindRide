import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { getRoute } from '../utils/osrmService';

const RoutePolyline = ({ start, end, color = '#FF5F00', weight = 5, opacity = 0.6 }) => {
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        const fetchRoute = async () => {
            if (start && end) {
                const routeData = await getRoute(start, end);
                if (routeData && routeData.geometry) {
                    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
                    const latLngs = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setPositions(latLngs);
                }
            }
        };

        fetchRoute();
    }, [start, end]);

    if (positions.length === 0) return null;

    return (
        <Polyline 
            positions={positions} 
            pathOptions={{ color, weight, opacity, lineCap: 'round', lineJoin: 'round' }} 
        />
    );
};

export default RoutePolyline;
