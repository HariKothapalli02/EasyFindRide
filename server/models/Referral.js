const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    referralCode: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'flagged'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Referral', ReferralSchema);
