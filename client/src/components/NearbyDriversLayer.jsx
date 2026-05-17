import React, { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import api from '../utils/api';
import { driverIcon } from './MapTracking';

const NearbyDriversLayer = ({ center, vehicleType }) => {
    const [drivers, setDrivers] = useState([]);
    const map = useMap();

    useEffect(() => {
        const fetchNearby = async () => {
            if (!center) return;
            try {
                const res = await api.get(`/rides/nearby?lat=${center.lat}&lng=${center.lng}&vehicleType=${vehicleType || ''}`);
                setDrivers(res.data);
            } catch (err) {
                console.error('Error fetching nearby drivers:', err);
            }
        };

        fetchNearby();
        const interval = setInterval(fetchNearby, 60000); // Update every 60s
        return () => clearInterval(interval);
    }, [center, vehicleType]);

    return (
        <>
            {drivers.map(driver => (
                <Marker 
                    key={driver.driverId._id} 
                    position={[driver.lat, driver.lng]} 
                    icon={driverIcon}
                />
            ))}
        </>
    );
};

export default NearbyDriversLayer;
