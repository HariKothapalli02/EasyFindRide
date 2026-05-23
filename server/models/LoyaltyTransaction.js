const mongoose = require('mongoose');

const LoyaltyTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true },
    type: { type: String, enum: ['earn', 'redeem', 'expired', 'bonus'], required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
