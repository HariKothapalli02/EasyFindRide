const mongoose = require('mongoose');

const FraudLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['referral_abuse', 'cancellation_manipulation', 'emulator_usage', 'vpn_detected', 'spoofing', 'gps_teleportation'], required: true },
    scoreDelta: { type: Number, required: true },
    details: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FraudLog', FraudLogSchema);
