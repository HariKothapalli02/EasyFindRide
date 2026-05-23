/**
 * Simple fare calculator for pool vs normal cab.
 * @param {Number} distanceKm 
 * @returns {Object}
 */
const calculatePoolFare = (distanceKm) => {
    const baseFare = 40;
    const perKmRate = 18;
    const poolDiscount = 0.35; // 35% discount

    const normalCabFare = baseFare + (distanceKm * perKmRate);
    const poolFare = normalCabFare * (1 - poolDiscount);

    return {
        normalCabFare: Math.round(normalCabFare),
        poolFare: Math.round(poolFare),
        discountPercent: poolDiscount * 100
    };
};

module.exports = {
    calculatePoolFare
};
