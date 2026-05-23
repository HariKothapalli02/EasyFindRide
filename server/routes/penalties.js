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

// GET customer penalties status, fraud risk score and limits
router.get('/customer-status', auth, async (req, res) => {
    try {
        const customer = await User.findById(req.user.id);
        if (!customer) return res.status(404).json({ msg: 'Customer not found' });

        // Calculate dynamic restriction warning banners
        const warnings = [];
        const abuseScore = ((customer.cancellationCount || 0) * 5) + ((customer.noShowCount || 0) * 15);

        if (customer.unpaidPenaltyAmount > 0) {
            warnings.push(`Outstanding dues of ₹${customer.unpaidPenaltyAmount} detected. Clear them now to restore booking priority.`);
        }
        if (customer.restrictionLevel === 'Cooldown') {
            warnings.push("Your account is in a temporary booking cooldown due to excessive cancellation attempts.");
        }
        if (customer.restrictionLevel === 'Restricted') {
            warnings.push("Cash rides are disabled due to repeated booking cancellations. Please pay online.");
        }
        if (abuseScore >= 15 && abuseScore < 50) {
            warnings.push("Frequent cancellations may lead to account cooling periods and ride matching limits.");
        }
        if (customer.noShowCount > 0) {
            warnings.push("Repeated rider no-shows caught. Please be at your pickup point promptly to avoid fees.");
        }
        if (warnings.length === 0) {
            warnings.push("Your profile is in perfect standing. Have a safe ride!");
        }

        res.json({
            fraudScore: customer.customerFraudScore || 0,
            restrictionLevel: customer.restrictionLevel || 'Normal',
            suspensionStatus: customer.suspensionStatus || false,
            unpaidPenaltyAmount: customer.unpaidPenaltyAmount || 0,
            cancellationCount: customer.cancellationCount || 0,
            noShowCount: customer.noShowCount || 0,
            warnings
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// GET customer penalties audit logs
router.get('/customer-history', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            userId: req.user.id, 
            status: 'cancelled',
            cancellationFee: { $gt: 0 }
        }).sort({ date: -1 });

        const history = bookings.map(b => ({
            date: b.date,
            rideId: b._id,
            reason: b.cancellationReason || 'Cancelled ride',
            penaltyType: b.cancelledBy === 'system' ? 'No-Show' : 'Late Cancel',
            amount: b.cancellationFee,
            status: 'Debited from Wallet',
            actionTaken: b.cancelledBy === 'system' ? 'Driver Compensated' : 'Fee Applied'
        }));

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST clear penalty balance manually using wallet balance
router.post('/clear-penalty', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const dues = user.unpaidPenaltyAmount || 0;
        if (dues <= 0) {
            return res.status(400).json({ msg: 'No outstanding penalties to settle.' });
        }

        // Check if wallet has enough cash
        if (user.walletBalance < dues) {
            return res.status(400).json({ msg: `Insufficient wallet balance. Please add money to clear dues.` });
        }

        user.walletBalance -= dues;
        user.unpaidPenaltyAmount = 0;
        user.pendingDues = Math.max(0, (user.pendingDues || 0) - dues);

        // Update restrictions
        await penaltyService.updateCustomerRestrictions(user._id);
        await user.save();

        // Create transaction history
        const WalletTransaction = require('../models/WalletTransaction');
        const tx = new WalletTransaction({
            userId: user._id,
            amount: -dues,
            type: 'penalty',
            description: `Paid outstanding cancellation penalty balance`
        });
        await tx.save();

        res.json({
            msg: `Unpaid penalty balance of ₹${dues} successfully settled!`,
            walletBalance: user.walletBalance,
            unpaidPenaltyAmount: user.unpaidPenaltyAmount,
            restrictionLevel: user.restrictionLevel
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// GET validate booking permissions
router.get('/validate-booking', auth, async (req, res) => {
    try {
        await penaltyService.validateBookingAttempt(req.user.id);
        res.json({ allowed: true });
    } catch (err) {
        res.status(403).json({ allowed: false, msg: err.message });
    }
});

module.exports = router;
