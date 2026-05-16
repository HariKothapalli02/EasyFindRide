import axios from 'axios';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export const getRoute = async (start, end) => {
    try {
        // start and end are { lat, lng }
        const url = `${OSRM_BASE_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const response = await axios.get(url);
        
        if (response.data.code === 'Ok') {
            const route = response.data.routes[0];
            return {
                geometry: route.geometry, // GeoJSON
                distance: (route.distance / 1000).toFixed(2), // km
                duration: Math.round(route.duration / 60), // minutes
                fullResponse: response.data
            };
        }
        return null;
    } catch (error) {
        console.error('OSRM API Error:', error);
        return null;
    }
};

export const searchLocations = async (query) => {
    try {
        if (!query || query.length < 3) return [];
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const response = await axios.get(url);
        return response.data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }));
    } catch (error) {
        console.error('Search Error:', error);
        return [];
    }
};

export const geocode = async (address) => {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await axios.get(url);
        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding Error:', error);
        return null;
    }
};

export const reverseGeocode = async (lat, lng, full = false) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const response = await axios.get(url);
        if (response.data) {
            if (full) return response.data.display_name;
            const addr = response.data.address;
            return addr.city || addr.town || addr.village || addr.suburb || addr.state;
        }
        return null;
    } catch (error) {
        console.error('Reverse Geocoding Error:', error);
        return null;
    }
};

export default { getRoute, geocode, reverseGeocode };
