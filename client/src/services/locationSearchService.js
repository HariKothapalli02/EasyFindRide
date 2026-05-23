// Simple geocoding service using OpenStreetMap Nominatim
export const searchLocation = async (query) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                address: item.display_name
            }));
        }
        return [];
    } catch (error) {
        console.error('Error searching location:', error);
        return [];
    }
};
