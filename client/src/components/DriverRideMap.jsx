import React, { useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import MapTracking, { pickupIcon, dropIcon, driverIcon } from './MapTracking';
import RoutePolyline from './RoutePolyline';
import useLiveLocation from '../hooks/useLiveLocation';

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

const DriverRideMap = ({ ride }) => {
    const { location: driverLoc } = useLiveLocation();

    if (!ride) return <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;

    const pickup = ride.pickupCoords;
    const drop = ride.dropCoords;
    const isPickedUp = ride.status === 'picked-up';

    const pointsToFit = [
        pickup ? [pickup.lat, pickup.lng] : null,
        drop ? [drop.lat, drop.lng] : null,
        driverLoc ? [driverLoc.lat, driverLoc.lng] : null
    ].filter(Boolean);

    return (
        <MapTracking center={driverLoc ? [driverLoc.lat, driverLoc.lng] : (pickup ? [pickup.lat, pickup.lng] : [17.3850, 78.4867])} zoom={15}>
            <AutoCenter points={pointsToFit} />
            
            {/* Pickup Marker */}
            {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
            
            {/* Drop Marker */}
            {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />}
            
            {/* Driver Marker (Self) */}
            {driverLoc && (
                <Marker 
                    position={[driverLoc.lat, driverLoc.lng]} 
                    icon={driverIcon}
                    rotationAngle={driverLoc.heading}
                />
            )}

            {/* Route Lines */}
            {/* If not picked up: Driver to Pickup */}
            {!isPickedUp && driverLoc && pickup && (
                <RoutePolyline start={driverLoc} end={pickup} color="#22c55e" opacity={0.6} />
            )}
            
            {/* Pickup to Drop (The main route) */}
            {pickup && drop && (
                <RoutePolyline start={pickup} end={drop} color="#FF5F00" weight={5} opacity={0.4} />
            )}

            {/* If picked up: Driver to Drop */}
            {isPickedUp && driverLoc && drop && (
                <RoutePolyline start={driverLoc} end={drop} color="#FF5F00" weight={7} />
            )}
        </MapTracking>
    );
};

export default DriverRideMap;
