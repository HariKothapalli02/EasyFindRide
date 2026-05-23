const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Avoid multiple reviews for the same booking
ReviewSchema.index({ bookingId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
