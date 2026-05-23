const express = require('express');
const router = express.Router();
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const walletService = require('../services/walletService');
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

// GET wallet balance & transaction log
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('walletBalance pendingDues');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const transactions = await WalletTransaction.find({ userId: req.user.id }).sort({ date: -1 });

        res.json({
            balance: user.walletBalance || 0,
            pendingDues: user.pendingDues || 0,
            history: transactions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST pay outstanding pending dues (Mock top-up clearance)
router.post('/pay-dues', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ msg: 'Payment amount must be greater than zero' });
        }

        const user = await walletService.clearDues(req.user.id, amount);
        res.json({
            msg: `Successfully cleared dues! Credited ₹${amount} to wallet.`,
            walletBalance: user.walletBalance,
            pendingDues: user.pendingDues
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
