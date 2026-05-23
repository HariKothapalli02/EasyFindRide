/**
 * Calculates the Haversine distance between two points in km.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Finds the nearest point on a given route path (array of [lng, lat]).
 * Returns the index and the distance in km.
 */
const findNearestPointOnRoute = (lat, lng, routeCoordinates) => {
    let minDistance = Infinity;
    let nearestIndex = -1;

    for (let i = 0; i < routeCoordinates.length; i++) {
        // routeCoordinates are [lng, lat]
        const pointLng = routeCoordinates[i][0];
        const pointLat = routeCoordinates[i][1];
        
        const dist = haversineDistance(lat, lng, pointLat, pointLng);
        if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
        }
    }

    return { index: nearestIndex, distanceKm: minDistance };
};

/**
 * Checks if a user's pickup and drop match the pool ride route.
 * @param {Object} pickup { lat, lng }
 * @param {Object} drop { lat, lng }
 * @param {Array} routeCoordinates Array of [lng, lat]
 * @param {Number} maxDetourKm Maximum allowed distance from route
 */
const isUserRouteMatchingPool = (pickup, drop, routeCoordinates, maxDetourKm = 1.5) => {
    const pickupMatch = findNearestPointOnRoute(pickup.lat, pickup.lng, routeCoordinates);
    const dropMatch = findNearestPointOnRoute(drop.lat, drop.lng, routeCoordinates);

    const pickupNearRoute = pickupMatch.distanceKm <= maxDetourKm;
    const dropNearRoute = dropMatch.distanceKm <= maxDetourKm;
    // Ensure pickup is before drop in the route direction
    const sameDirection = pickupMatch.index < dropMatch.index;

    return {
        isMatch: pickupNearRoute && dropNearRoute && sameDirection,
        pickupMatch,
        dropMatch
    };
};

/**
 * Calculates approximate pickup/drop time based on progress along route points.
 */
const calculateApproxTime = (driverStartTime, totalDurationMin, pointIndex, totalPoints) => {
    const start = new Date(driverStartTime).getTime();
    const progressRatio = totalPoints > 1 ? pointIndex / (totalPoints - 1) : 0;
    const timeOffsetMs = progressRatio * totalDurationMin * 60 * 1000;
    
    return new Date(start + timeOffsetMs);
};

module.exports = {
    haversineDistance,
    findNearestPointOnRoute,
    isUserRouteMatchingPool,
    calculateApproxTime
};
