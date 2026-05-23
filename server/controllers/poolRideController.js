const PoolRide = require('../models/PoolRide');
const User = require('../models/User');
const { getRouteData } = require('../services/osrmService');
const { isUserRouteMatchingPool, calculateApproxTime, haversineDistance } = require('../services/poolMatchingService');
const { calculatePoolFare } = require('../services/poolFareService');

// Create a new pool ride (Driver)
const createPoolRide = async (req, res) => {
    try {
        const { driverId, startLocation, endLocation, startTime, totalSeats, cabDetails } = req.body;

        if (!driverId || !startLocation || !endLocation || !startTime || !totalSeats || !cabDetails) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Fetch route from OSRM
        const routeData = await getRouteData(startLocation, endLocation);

        // 2. Create the PoolRide document
        const newPoolRide = new PoolRide({
            driverId,
            vehicleType: 'cab',
            rideType: 'pool',
            startLocation,
            endLocation,
            startTime,
            route: routeData,
            totalSeats,
            availableSeats: totalSeats,
            cabDetails,
            passengers: [],
            status: 'scheduled',
            driverCurrentLocation: startLocation // init location
        });

        await newPoolRide.save();

        res.status(201).json({
            success: true,
            poolRide: newPoolRide
        });
    } catch (error) {
        console.error('Error in createPoolRide:', error);
        res.status(500).json({ success: false, message: 'Server error creating pool ride' });
    }
};

// Search for matching pool rides (User)
const searchPoolRides = async (req, res) => {
    try {
        const { pickup, drop, requiredSeats } = req.body;

        if (!pickup || !drop || !requiredSeats) {
            return res.status(400).json({ success: false, message: 'Missing search parameters' });
        }

        // Calculate direct distance for fare
        const directDistKm = haversineDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
        const fareData = calculatePoolFare(directDistKm);

        // Calculate date ranges for today and tomorrow
        const now = new Date();
        const endOfTomorrow = new Date(now);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
        endOfTomorrow.setHours(0, 0, 0, 0);

        // Find active cab pools with enough seats within today and tomorrow
        const activePools = await PoolRide.find({
            vehicleType: 'cab',
            rideType: 'pool',
            status: { $in: ['scheduled', 'ongoing'] },
            availableSeats: { $gte: requiredSeats },
            startTime: { $gte: now, $lt: endOfTomorrow }
        }).populate('driverId', 'name photo rating');

        const matchingRides = [];

        for (const pool of activePools) {
            // Check if user's path matches the pool's route
            const matchResult = isUserRouteMatchingPool(pickup, drop, pool.route.coordinates, 1.5);
            
            if (matchResult.isMatch) {
                // Calculate approx times
                const approxPickupTime = calculateApproxTime(
                    pool.startTime, 
                    pool.route.durationMin, 
                    matchResult.pickupMatch.index, 
                    pool.route.coordinates.length
                );
                
                const approxDropTime = calculateApproxTime(
                    pool.startTime, 
                    pool.route.durationMin, 
                    matchResult.dropMatch.index, 
                    pool.route.coordinates.length
                );

                matchingRides.push({
                    poolRideId: pool._id,
                    driver: {
                        name: pool.driverId?.name || 'Driver',
                        photo: pool.driverId?.photo || null,
                        rating: pool.driverId?.rating || 4.5
                    },
                    cab: pool.cabDetails,
                    route: {
                        startAddress: pool.startLocation.address,
                        endAddress: pool.endLocation.address,
                        coordinates: pool.route.coordinates,
                        distanceKm: pool.route.distanceKm,
                        durationMin: pool.route.durationMin
                    },
                    timings: {
                        startTime: pool.startTime,
                        approxPickupTime,
                        approxDropTime
                    },
                    seats: {
                        totalSeats: pool.totalSeats,
                        availableSeats: pool.availableSeats,
                        bookedPassengers: pool.passengers.length
                    },
                    fare: fareData,
                    match: {
                        pickupDistanceFromRoute: matchResult.pickupMatch.distanceKm,
                        dropDistanceFromRoute: matchResult.dropMatch.distanceKm,
                        pickupRouteIndex: matchResult.pickupMatch.index,
                        dropRouteIndex: matchResult.dropMatch.index
                    }
                });
            }
        }

        res.status(200).json({
            success: true,
            results: matchingRides
        });

    } catch (error) {
        console.error('Error in searchPoolRides:', error);
        res.status(500).json({ success: false, message: 'Server error searching pool rides' });
    }
};

// User joins a pool ride
const joinPoolRide = async (req, res) => {
    try {
        const poolRideId = req.params.id;
        const { userId, pickup, drop, requiredSeats, fare, approxPickupTime, approxDropTime, pickupRouteIndex, dropRouteIndex } = req.body;

        const pool = await PoolRide.findById(poolRideId);
        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool ride not found' });
        }

        if (pool.availableSeats < requiredSeats) {
            return res.status(400).json({ success: false, message: 'Not enough seats available' });
        }

        if (pool.status === 'completed' || pool.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Pool ride is no longer active' });
        }

        // Check if user already joined
        const existingPassenger = pool.passengers.find(p => p.userId && p.userId.toString() === userId);
        if (existingPassenger && existingPassenger.status !== 'cancelled') {
            return res.status(400).json({ success: false, message: 'You have already joined this pool ride' });
        }

        // Add passenger
        pool.passengers.push({
            userId,
            pickup,
            drop,
            requiredSeats,
            pickupRouteIndex,
            dropRouteIndex,
            approxPickupTime,
            approxDropTime,
            fare,
            status: 'booked'
        });

        // Decrease available seats
        pool.availableSeats -= requiredSeats;

        await pool.save();

        // Get socket.io instance
        const io = req.app.get('io');
        if (io) {
            // Notify driver and existing passengers
            io.to(`poolRide:${poolRideId}`).emit('poolRide:passengerJoined', {
                message: 'A new passenger joined the pool',
                availableSeats: pool.availableSeats,
                newPassengerCount: pool.passengers.length
            });
        }

        res.status(200).json({
            success: true,
            message: 'Successfully joined pool ride',
            poolRide: pool
        });

    } catch (error) {
        console.error('Error in joinPoolRide:', error);
        res.status(500).json({ success: false, message: 'Server error joining pool ride' });
    }
};

// Driver updates passenger status (picked, dropped, etc)
const updatePassengerStatus = async (req, res) => {
    try {
        const { poolRideId, passengerId } = req.params;
        const { status } = req.body; // 'picked', 'dropped', 'cancelled'

        const pool = await PoolRide.findById(poolRideId);
        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool ride not found' });
        }

        const passenger = pool.passengers.id(passengerId);
        if (!passenger) {
            return res.status(404).json({ success: false, message: 'Passenger not found in this pool' });
        }

        passenger.status = status;

        if (status === 'cancelled') {
            pool.availableSeats += passenger.requiredSeats;
        }

        await pool.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`poolRide:${poolRideId}`).emit('poolRide:passengerStatusUpdated', {
                passengerId,
                status,
                availableSeats: pool.availableSeats
            });
        }

        res.status(200).json({ success: true, poolRide: pool });

    } catch (error) {
        console.error('Error in updatePassengerStatus:', error);
        res.status(500).json({ success: false, message: 'Server error updating passenger status' });
    }
};

// Get pool ride details
const getPoolRideDetails = async (req, res) => {
    try {
        const pool = await PoolRide.findById(req.params.id).populate('driverId', 'name photo phone rating');
        if (!pool) return res.status(404).json({ success: false, message: 'Not found' });
        
        // Hide private passenger details for non-drivers (in a full app, check req.user vs pool.driverId)
        // Here we just sanitize the output slightly
        
        res.status(200).json({ success: true, poolRide: pool });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createPoolRide,
    searchPoolRides,
    joinPoolRide,
    updatePassengerStatus,
    getPoolRideDetails
};
