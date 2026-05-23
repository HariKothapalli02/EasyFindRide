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

// GET: Flagged/Frozen users and fraud logs
router.get('/fraud/flagged-accounts', adminAuth, async (req, res) => {
    try {
        const flaggedUsers = await User.find({
            $or: [
                { customerFraudScore: { $gt: 0 } },
                { driverFraudScore: { $gt: 0 } },
                { referralFraudScore: { $gt: 0 } },
                { isFrozen: true }
            ]
        }).select('-password').sort({ customerFraudScore: -1, driverFraudScore: -1 });

        const fraudLogs = await FraudLog.find({})
            .populate('userId', 'name email phone role')
            .sort({ date: -1 });

        res.json({
            users: flaggedUsers,
            logs: fraudLogs
        });
    } catch (err) {
        console.error('Fetch flagged accounts error:', err);
        res.status(500).send('Server error');
    }
});

// POST: Freeze or unfreeze an account
router.post('/freeze-account', adminAuth, async (req, res) => {
    try {
        const { userId, isFrozen } = req.body;
        if (!userId) return res.status(400).json({ msg: 'User ID is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isFrozen = isFrozen;
        // If unfreezing, reset their fraud score so they aren't auto-frozen immediately
        if (!isFrozen) {
            user.customerFraudScore = 0;
            user.driverFraudScore = 0;
            user.referralFraudScore = 0;
        } else {
            // Force offline if frozen
            user.isOnline = false;
        }

        await user.save();

        res.json({
            msg: `User account successfully ${isFrozen ? 'frozen' : 'unfrozen'}.`,
            user
        });
    } catch (err) {
        console.error('Freeze account error:', err);
        res.status(500).send('Server error');
    }
});

// POST: Adjust a user's loyalty points manually
router.post('/manually-adjust-points', adminAuth, async (req, res) => {
    try {
        const { userId, pointsDelta } = req.body;
        if (!userId || pointsDelta === undefined) {
            return res.status(400).json({ msg: 'User ID and pointsDelta are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) + Number(pointsDelta));
        if (pointsDelta > 0) {
            user.totalEarnedPoints = (user.totalEarnedPoints || 0) + Number(pointsDelta);
        }

        // Recheck Tier
        const LoyaltyTransaction = require('../models/LoyaltyTransaction');
        const points = user.loyaltyPoints;
        if (points >= 500) user.rewardTier = 'Platinum';
        else if (points >= 250) user.rewardTier = 'Gold';
        else if (points >= 100) user.rewardTier = 'Silver';
        else user.rewardTier = 'Bronze';

        await user.save();

        // Log transaction
        const auditLog = new LoyaltyTransaction({
            userId,
            points: Number(pointsDelta),
            type: pointsDelta >= 0 ? 'earn' : 'redeem',
            description: `Admin Manual Adjustment: ${pointsDelta >= 0 ? '+' : ''}${pointsDelta} points`
        });
        await auditLog.save();

        res.json({
            msg: `Loyalty points adjusted by ${pointsDelta}. New balance: ${user.loyaltyPoints}`,
            user
        });
    } catch (err) {
        console.error('Manual adjust points error:', err);
        res.status(500).send('Server error');
    }
});

// POST: Reverse a wallet penalty / adjust wallet balance
router.post('/reverse-penalty', adminAuth, async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        if (!userId || !amount) {
            return res.status(400).json({ msg: 'User ID and adjustment amount are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const WalletTransaction = require('../models/WalletTransaction');
        user.walletBalance = (user.walletBalance || 0) + Number(amount);
        
        // If they had pending dues, reduce dues if adjusting positively
        if (amount > 0 && user.pendingDues > 0) {
            const duesReduction = Math.min(user.pendingDues, amount);
            user.pendingDues -= duesReduction;
        }

        await user.save();

        const walletTx = new WalletTransaction({
            userId,
            amount: Number(amount),
            type: amount >= 0 ? 'refund' : 'penalty',
            description: `Admin Adjustment: ${reason || 'Manual override'}`
        });
        await walletTx.save();

        res.json({
            msg: `Wallet adjusted successfully by ₹${amount}. New balance: ₹${user.walletBalance}`,
            user
        });
    } catch (err) {
        console.error('Reverse penalty error:', err);
        res.status(500).send('Server error');
    }
});

// POST: Blacklist a device fingerprint
router.post('/blacklist-device', adminAuth, async (req, res) => {
    try {
        const { deviceFingerprint } = req.body;
        if (!deviceFingerprint) {
            return res.status(400).json({ msg: 'Device fingerprint is required' });
        }

        // Freeze all users sharing this fingerprint
        const usersToFreeze = await User.find({ deviceFingerprint });
        for (const user of usersToFreeze) {
            user.isFrozen = true;
            user.isOnline = false;
            await user.save();
        }

        res.json({
            msg: `Successfully blacklisted device fingerprint. Frozen ${usersToFreeze.length} linked account(s).`
        });
    } catch (err) {
        console.error('Blacklist device error:', err);
        res.status(500).send('Server error');
    }
});

const FraudLog = require('../models/FraudLog');

module.exports = router;
