const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const penaltyService = require('../services/penaltyService');
const jwt = require('jsonwebtoken');

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

// GET driver reliability details
router.get('/driver-reliability', auth, async (req, res) => {
    try {
        const driver = await User.findById(req.user.id).select('driverReliabilityScore cancellationsToday isFrozen');
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });

        res.json({
            reliabilityScore: driver.driverReliabilityScore || 100,
            cancellationsToday: driver.cancellationsToday || 0,
            isSuspended: driver.isFrozen
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST cancel a booking by customer
router.post('/cancel-customer-ride', auth, async (req, res) => {
    try {
        const { bookingId, reason } = req.body;
        if (!bookingId) return res.status(400).json({ msg: 'Booking ID is required' });

        // Verify booking ownership
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id.toString()) {
            return res.status(401).json({ msg: 'Unauthorized. You do not own this ride.' });
        }

        const cancelledBooking = await penaltyService.handleCustomerCancellation(bookingId, reason || 'Customer request');
        res.json({
            msg: 'Ride cancelled successfully',
            cancellationFee: cancelledBooking.cancellationFee,
            booking: cancelledBooking
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: err.message });
    }
});

// POST cancel a booking by driver
router.post('/cancel-driver-ride', auth, async (req, res) => {
    try {
        const { bookingId, reason } = req.body;
        if (!bookingId) return res.status(400).json({ msg: 'Booking ID is required' });

        // Verify booking is assigned to driver
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ msg: 'Booking not found' });
        if (!booking.driverId || booking.driverId.toString() !== req.user.id.toString()) {
            return res.status(401).json({ msg: 'Unauthorized. You are not assigned to this ride.' });
        }

        const result = await penaltyService.handleDriverCancellation(bookingId, req.user.id, reason || 'Driver request');
        res.json({
            msg: 'Ride cancelled successfully',
            stats: result.driverStats,
            booking: result.booking
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: err.message });
    }
});

module.exports = router;
