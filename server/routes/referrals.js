const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const referralService = require('../services/referralService');
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

// GET referral information for user
router.get('/info', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Generate a referral code if they don't have one
        if (!user.referralCode) {
            const code = await referralService.generateReferralCode(user.name);
            user.referralCode = code;
            await user.save();
        }

        // Get total invites and pending/completed lists
        const referrals = await Referral.find({ referrerId: req.user.id }).populate('refereeId', 'name createdAt');
        
        // Sum completed payouts
        const completedReferrals = referrals.filter(r => r.status === 'completed');
        const totalEarnings = completedReferrals.length * 50;

        res.json({
            code: user.referralCode,
            fraudScore: user.referralFraudScore || 0,
            earnings: totalEarnings,
            referralsCount: referrals.length,
            referrals
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST apply a referral code (Referee applying code)
router.post('/apply', auth, async (req, res) => {
    try {
        const { code, deviceFingerprint } = req.body;
        if (!code) return res.status(400).json({ msg: 'Referral code is required' });

        const result = await referralService.applyReferralCode(
            req.user.id,
            code,
            deviceFingerprint || req.headers['user-agent']
        );

        res.json({
            msg: result.isSuspicious 
                ? 'Referral applied successfully (queued for review due to matching footprints).' 
                : 'Referral code applied successfully!',
            referral: result.referral
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ msg: err.message });
    }
});

module.exports = router;
