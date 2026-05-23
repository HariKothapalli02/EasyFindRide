const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const DriverLocation = require('../models/DriverLocation');

// Middleware to verify JWT and check if Admin
const adminAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        // Check role
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Administrator privileges required' });
        }
        
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// GET: All riders (customers)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Admin users fetch error:', err);
        res.status(500).send('Server error');
    }
});

// GET: All drivers
router.get('/drivers', adminAuth, async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' }).select('-password').sort({ createdAt: -1 });
        res.json(drivers);
    } catch (err) {
        console.error('Admin drivers fetch error:', err);
        res.status(500).send('Server error');
    }
});

// GET: All rides (bookings)
router.get('/bookings', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('userId', 'name email phone')
            .populate('driverId', 'name email phone vehicleType vehicleNumber rating')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        console.error('Admin bookings fetch error:', err);
        res.status(500).send('Server error');
    }
});

// GET: All reviews
router.get('/reviews', adminAuth, async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('userId', 'name email phone')
            .populate('driverId', 'name email phone vehicleType vehicleNumber rating')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Admin reviews fetch error:', err);
        res.status(500).send('Server error');
    }
});

// GET: Live tracking for any specific ride
router.get('/rides/:rideId/tracking', adminAuth, async (req, res) => {
    try {
        const ride = await Booking.findById(req.params.rideId)
            .populate('userId', 'name phone')
            .populate('driverId', 'name phone vehicleType vehicleNumber rating');
            
        if (!ride) return res.status(404).json({ msg: 'Ride not found' });

        if (!ride.driverId) {
            return res.json({ ride, driverLocation: null });
        }

        const driverLocation = await DriverLocation.findOne({ driverId: ride.driverId._id || ride.driverId });
        res.json({ ride, driverLocation });
    } catch (err) {
        console.error('Admin ride tracking error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
