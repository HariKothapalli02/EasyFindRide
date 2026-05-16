import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
export const pickupIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #22c55e; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7]
});

export const dropIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #FF5F00; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7]
});

export const driverIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="color: #FF5F00; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z"/>
            </svg>
          </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const MapTracking = ({ center = [17.3850, 78.4867], zoom = 13, children, style }) => {
    return (
        <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}>
            <MapContainer 
                center={center} 
                zoom={zoom} 
                style={{ height: '100%', width: '100%', ...style }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {children}
            </MapContainer>
        </div>
    );
};

export default MapTracking;
