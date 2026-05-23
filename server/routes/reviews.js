const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

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

// Create a new review for a completed booking
router.post('/', auth, async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        if (!bookingId || !rating) {
            return res.status(400).json({ msg: 'Booking ID and rating are required' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Verify the booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({ msg: 'You can only review completed rides' });
        }

        // Verify the customer is the one who booked the ride
        if (booking.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'You can only review rides that you booked yourself' });
        }

        // Verify the driver was assigned
        if (!booking.driverId) {
            return res.status(400).json({ msg: 'No driver was assigned to this ride' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ msg: 'You have already reviewed this ride' });
        }

        // Create review
        const review = new Review({
            userId: req.user.id,
            driverId: booking.driverId,
            bookingId,
            rating: Number(rating),
            comment: comment || ''
        });

        await review.save();

        // Calculate and update driver's average rating
        const reviews = await Review.find({ driverId: booking.driverId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        // Update user (driver) document
        await User.findByIdAndUpdate(booking.driverId, {
            rating: Math.round(avgRating * 10) / 10 // round to 1 decimal place
        });

        res.json({ msg: 'Review submitted successfully', review });
    } catch (err) {
        console.error('Submit Review Error:', err);
        res.status(500).send('Server error');
    }
});

// Get reviews for a specific driver
router.get('/driver/:driverId', async (req, res) => {
    try {
        const reviews = await Review.find({ driverId: req.params.driverId })
            .populate('userId', 'name profilePhoto')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
