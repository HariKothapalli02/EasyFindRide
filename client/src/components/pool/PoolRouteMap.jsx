import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const PoolRouteMap = ({ routeCoordinates, driverLocation, pickup, drop }) => {
    // routeCoordinates are [lng, lat], Leaflet expects [lat, lng]
    const [path, setPath] = useState([]);
    
    useEffect(() => {
        if (routeCoordinates && routeCoordinates.length > 0) {
            const leafletPath = routeCoordinates.map(coord => [coord[1], coord[0]]);
            setPath(leafletPath);
        }
    }, [routeCoordinates]);

    const center = path.length > 0 
        ? path[Math.floor(path.length / 2)] 
        : (driverLocation ? [driverLocation.lat, driverLocation.lng] : [16.8073, 81.5316]); // Fallback

    const cabIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png', // simple cab icon
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    const pickupIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // simple green pin
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });

    const dropIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190406.png', // simple red pin
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });

    return (
        <div className="w-full h-64 md:h-96 rounded-[40px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-black/5 animate-fade-in relative z-0">
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {path.length > 0 && (
                    <Polyline positions={path} color="blue" weight={4} opacity={0.7} />
                )}

                {driverLocation && (
                    <Marker position={[driverLocation.lat, driverLocation.lng]} icon={cabIcon}>
                        <Popup>Driver's Current Location</Popup>
                    </Marker>
                )}

                {pickup && (
                    <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                        <Popup>Pickup: {pickup.address || 'Location'}</Popup>
                    </Marker>
                )}

                {drop && (
                    <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
                        <Popup>Drop: {drop.address || 'Location'}</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default PoolRouteMap;
