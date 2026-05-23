const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

/**
 * Fetch route details from OSRM public API
 * @param {Object} start { lat, lng }
 * @param {Object} end { lat, lng }
 * @returns {Promise<Object>} { coordinates, distanceKm, durationMin }
 */
const getRouteData = async (start, end) => {
    try {
        // OSRM coordinates format: lng,lat
        const url = `${OSRM_BASE_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        
        // We can use native fetch in newer Node versions, or we could require('https') / 'node-fetch'
        // Assuming Node 18+ where global fetch is available.
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No route found from OSRM');
        }

        const route = data.routes[0];
        const coordinates = route.geometry.coordinates; // Array of [lng, lat]
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;

        return {
            coordinates,
            distanceKm,
            durationMin
        };
    } catch (error) {
        console.error('Error fetching route from OSRM:', error.message);
        throw error;
    }
};

module.exports = {
    getRouteData
};
