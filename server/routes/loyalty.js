const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const loyaltyService = require('../services/loyaltyService');
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

// Admin check middleware
const admin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin access only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// GET current loyalty point balance & history
router.get('/points', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('loyaltyPoints totalEarnedPoints redeemedPoints rewardTier');
        const transactions = await LoyaltyTransaction.find({ userId: req.user.id }).sort({ date: -1 });
        res.json({
            points: user.loyaltyPoints || 0,
            totalEarned: user.totalEarnedPoints || 0,
            totalRedeemed: user.redeemedPoints || 0,
            tier: user.rewardTier || 'Bronze',
            history: transactions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST redeem points for wallet balance discount
router.post('/redeem', auth, async (req, res) => {
    try {
        const { points } = req.body;
        if (!points || ![50, 100, 250].includes(points)) {
            return res.status(400).json({ msg: 'Invalid points option. Select 50, 100, or 250.' });
        }

        const result = await loyaltyService.redeemPoints(req.user.id, points);
        res.json({
            msg: `Successfully redeemed ${points} points for ₹${result.discountAmount}!`,
            loyaltyPoints: result.user.loyaltyPoints,
            walletBalance: result.user.walletBalance
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: err.message });
    }
});

// POST manually override/adjust points (Admin only)
router.post('/manual-adjust', [auth, admin], async (req, res) => {
    try {
        const { targetUserId, points, description } = req.body;
        if (!targetUserId || !points) {
            return res.status(400).json({ msg: 'Target user ID and points delta are required' });
        }

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.loyaltyPoints = Math.max((user.loyaltyPoints || 0) + points, 0);
        user.totalEarnedPoints = Math.max((user.totalEarnedPoints || 0) + (points > 0 ? points : 0), 0);
        await user.save();

        const transaction = new LoyaltyTransaction({
            userId: targetUserId,
            points,
            type: points > 0 ? 'bonus' : 'expired',
            description: description || 'Manual admin override adjustment'
        });
        await transaction.save();

        res.json({ msg: 'Loyalty points adjusted successfully', loyaltyPoints: user.loyaltyPoints });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
