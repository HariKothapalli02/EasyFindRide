const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const DriverLocation = require('../models/DriverLocation');

// Middleware to verify JWT
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get pending rides for driver's city
router.get('/pending', auth, async (req, res) => {
    try {
        const { city } = req.query;
        // Case-insensitive search for city
        const query = { status: 'pending' };
        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }
        const rides = await Booking.find(query).populate('userId', 'name phone').sort({ date: -1 });
        res.json(rides);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get Active Ride for current user (either as customer or driver)
router.get('/active', auth, async (req, res) => {
    try {
        const ride = await Booking.findOne({ 
            $or: [
                { userId: req.user.id },
                { driverId: req.user.id }
            ],
            status: { $in: ['accepted', 'picked-up'] } 
        })
        .populate('driverId', 'name phone profilePhoto vehicleNumber vehicleType')
        .populate('userId', 'name phone');
        
        res.json(ride);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Bookings History
router.get('/history', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            $or: [{ userId: req.user.id }, { driverId: req.user.id }] 
        })
        .populate('driverId', 'name phone profilePhoto vehicleNumber')
        .populate('userId', 'name phone')
        .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Book a Ride (Notify Drivers)
router.post('/book', auth, async (req, res) => {
    try {
        const { pickup, drop, vehicleType, price, city, pickupCoords, dropCoords } = req.body;
        // Standardize everything
        const standardizedCity = (city || pickup.split(',')[0]).toLowerCase().trim();
        const standardizedVehicle = (vehicleType || '').toLowerCase().trim();
        
        const newBooking = new Booking({
            userId: req.user.id,
            pickup,
            pickupCoords,
            drop,
            dropCoords,
            vehicleType: standardizedVehicle,
            price,
            city: standardizedCity
        });
        const booking = await newBooking.save();

        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');

        // BROAD DISPATCH: Find all drivers with matching vehicle (Case Insensitive)
        const drivers = await User.find({ 
            role: 'driver'
        });

        const fullBooking = await Booking.findById(booking._id).populate('userId', 'name phone');
        console.log(`[DISPATCH] New Ride: ${standardizedCity} | Vehicle: ${standardizedVehicle}`);
        console.log(`[DISPATCH] Checking ${drivers.length} online drivers...`);

        drivers.forEach(driver => {
            // Check vehicle match manually to be safe with casing
            if (driver.vehicleType && driver.vehicleType.toLowerCase().trim() === standardizedVehicle) {
                const socketId = userSockets.get(driver._id.toString());
                if (socketId) {
                    console.log(`[DISPATCH] ✅ Signal Sent to ${driver.name} (Socket: ${socketId})`);
                    io.to(socketId).emit('new_ride_request', fullBooking);
                } else {
                    console.log(`[DISPATCH] ❌ Driver ${driver.name} is offline (No Socket)`);
                }
            }
        });

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Accept a Ride (UNIVERSAL RESCUE VERSION)
router.post('/accept', auth, async (req, res) => {
    try {
        const { rideId } = req.body;
        console.log(`[RESCUE] Accept attempt. Received ID: "${rideId}"`);
        
        // Strategy A: Find by specific ID
        let booking = await Booking.findById(rideId);
        
        // Strategy B: Find by ID string comparison
        if (!booking) {
            const all = await Booking.find({ status: 'pending' });
            booking = all.find(b => b._id.toString() === String(rideId));
        }

        // Strategy C: UNIVERSAL FALLBACK - Take the latest pending ride
        // If the driver is seeing a ride on screen, this will find it.
        if (!booking) {
            console.log(`[RESCUE] All ID matches failed. Falling back to LATEST pending.`);
            booking = await Booking.findOne({ status: 'pending' }).sort({ createdAt: -1 });
        }

        if (!booking) {
            const total = await Booking.countDocuments({});
            const serverTime = new Date().toLocaleTimeString();
            console.log(`[RESCUE_FAILURE] (${serverTime}) DB empty. Total: ${total}`);
            return res.status(404).json({ 
                msg: `Ride not found in DB. Server Time: ${serverTime}`,
                totalInDb: total 
            });
        }
        
        console.log(`[RESCUE_SUCCESS] Found and Locking: ${booking._id}`);
        booking.driverId = req.user.id;
        booking.status = 'accepted';
        await booking.save();

        const driver = await User.findById(req.user.id).select('-password');
        const updatedBooking = await Booking.findById(rideId)
            .populate('driverId', 'name phone profilePhoto vehicleNumber vehicleType')
            .populate('userId', 'name phone');

        // Notify Customer via Socket
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const customerId = updatedBooking.userId._id || updatedBooking.userId;
        const customerSocketId = userSockets.get(customerId.toString());
        
        if (customerSocketId) {
            io.to(customerSocketId).emit('ride_accepted', updatedBooking);
        }

        res.json(updatedBooking);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Mark as Picked Up
router.post('/picked-up', auth, async (req, res) => {
    try {
        const { rideId } = req.body;
        const booking = await Booking.findByIdAndUpdate(rideId, { status: 'picked-up' }, { new: true })
            .populate('driverId', 'name phone profilePhoto vehicleNumber vehicleType')
            .populate('userId', 'name phone');
        
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        
        // Use ._id since it's populated
        const customerId = booking.userId._id || booking.userId;
        const customerSocketId = userSockets.get(customerId.toString());
        
        if (customerSocketId) {
            io.to(customerSocketId).emit('ride_picked_up', booking);
        }
        
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Cancel Ride
router.post('/cancel', auth, async (req, res) => {
    try {
        const { rideId } = req.body;
        const booking = await Booking.findByIdAndUpdate(rideId, { status: 'cancelled' }, { new: true });
        
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        
        // Notify customer
        const customerSocketId = userSockets.get(booking.userId.toString());
        if (customerSocketId) io.to(customerSocketId).emit('ride_cancelled', booking);
        
        // Notify driver if assigned
        if (booking.driverId) {
            const driverSocketId = userSockets.get(booking.driverId.toString());
            if (driverSocketId) io.to(driverSocketId).emit('ride_cancelled', booking);
        }
        
        res.json({ message: 'Ride cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Complete a Ride
router.post('/complete', auth, async (req, res) => {
    try {
        const { rideId } = req.body;
        const booking = await Booking.findByIdAndUpdate(rideId, { status: 'completed' }, { new: true });
        
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        
        // Notify Customer via Socket
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const customerSocketId = userSockets.get(booking.userId.toString());
        
        if (customerSocketId) {
            io.to(customerSocketId).emit('ride_completed', booking);
        }

        res.json({ msg: 'Ride completed successfully', booking });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Mock vehicles and prices logic
router.get('/vehicles', (req, res) => {
    const { pickup, drop } = req.query;
    if (!pickup || !drop) return res.status(400).json({ msg: 'Pickup and drop are required' });
    
    const vehicles = [
        { type: 'Bike', price: 40, icon: 'Bike' },
        { type: 'Auto', price: 80, icon: 'Car' },
        { type: 'Car', price: 150, icon: 'Car' }
    ];
    res.json(vehicles);
});

// Update Driver Location
router.post('/location', auth, async (req, res) => {
    try {
        const { lat, lng, heading, speed, isOnline } = req.body;
        const driverId = req.user.id;

        const locationUpdate = {
            driverId,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            lat,
            lng,
            heading: heading || 0,
            speed: speed || 0,
            isOnline: isOnline !== undefined ? isOnline : true,
            updatedAt: new Date()
        };

        const driverLocation = await DriverLocation.findOneAndUpdate(
            { driverId },
            locationUpdate,
            { upsert: true, new: true }
        );

        res.json(driverLocation);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get Nearby Drivers
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5, vehicleType } = req.query; // radius in km
        if (!lat || !lng) return res.status(400).json({ msg: 'Coordinates are required' });

        const drivers = await DriverLocation.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
                }
            },
            isOnline: true
        }).populate('driverId', 'name vehicleType vehicleNumber');

        // Filter by vehicle type if provided
        let filteredDrivers = drivers;
        if (vehicleType) {
            filteredDrivers = drivers.filter(d => 
                d.driverId && d.driverId.vehicleType && d.driverId.vehicleType.toLowerCase() === vehicleType.toLowerCase()
            );
        }

        res.json(filteredDrivers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get Tracking Data for a specific ride
router.get('/:rideId/tracking', auth, async (req, res) => {
    try {
        const ride = await Booking.findById(req.params.rideId).populate('driverId');
        if (!ride) return res.status(404).json({ msg: 'Ride not found' });

        if (!ride.driverId) return res.json({ ride, driverLocation: null });

        const driverLocation = await DriverLocation.findOne({ driverId: ride.driverId._id });
        res.json({ ride, driverLocation });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
