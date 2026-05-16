import React, { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import MapTracking, { pickupIcon, dropIcon, driverIcon } from './MapTracking';
import RoutePolyline from './RoutePolyline';
import useSocket from '../hooks/useSocket';
import { socket } from '../utils/api';

const AutoCenter = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points && points.length > 0) {
            const validPoints = points.filter(p => p && p[0] && p[1]);
            if (validPoints.length > 0) {
                map.fitBounds(validPoints, { padding: [50, 50] });
            }
        }
    }, [points, map]);
    return null;
};

const CustomerRideMap = ({ ride }) => {
    const [driverLoc, setDriverLoc] = useState(null);
    
    useSocket({
        'driver:location:broadcast': (data) => {
            if (ride && data.driverId === (ride.driverId?._id || ride.driverId)) {
                setDriverLoc(data);
            }
        }
    });

    useEffect(() => {
        if (ride?._id) {
            socket.emit('customer:track:ride', ride._id);
        }
    }, [ride?._id]);

    if (!ride) return <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;

    const pickup = ride.pickupCoords || { lat: 17.3850, lng: 78.4867 }; // Fallback
    const drop = ride.dropCoords;
    const isPickedUp = ride.status === 'picked-up' || ride.status === 'ongoing';

    const pointsToFit = [
        [pickup.lat, pickup.lng],
        drop ? [drop.lat, drop.lng] : null,
        driverLoc ? [driverLoc.lat, driverLoc.lng] : null
    ].filter(Boolean);

    return (
        <MapTracking center={[pickup.lat, pickup.lng]} zoom={15}>
            <AutoCenter points={pointsToFit} />
            
            {/* Pickup Marker */}
            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
            
            {/* Drop Marker */}
            {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />}
            
            {/* Driver Marker */}
            {driverLoc && (
                <Marker 
                    position={[driverLoc.lat, driverLoc.lng]} 
                    icon={driverIcon}
                    rotationAngle={driverLoc.heading}
                />
            )}

            {/* Route Lines */}
            {/* If not picked up: Driver to Pickup */}
            {!isPickedUp && driverLoc && (
                <RoutePolyline start={driverLoc} end={pickup} color="#22c55e" opacity={0.4} />
            )}
            
            {/* Pickup to Drop (Always shown if drop exists) */}
            {drop && (
                <RoutePolyline start={pickup} end={drop} />
            )}

            {/* If picked up: Driver to Drop */}
            {isPickedUp && driverLoc && drop && (
                <RoutePolyline start={driverLoc} end={drop} color="#FF5F00" weight={7} />
            )}
        </MapTracking>
    );
};

export default CustomerRideMap;
