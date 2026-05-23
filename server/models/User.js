const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePhoto: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'driver', 'admin'], default: 'customer' },
    // Driver specific fields
    vehicleType: { type: String, enum: ['Bike', 'Auto', 'Car', ''] },
    vehicleNumber: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 },
    city: { type: String, default: 'Hyderabad' }, // Default city for simulation
    
    // Loyalty Program
    loyaltyPoints: { type: Number, default: 0 },
    totalEarnedPoints: { type: Number, default: 0 },
    redeemedPoints: { type: Number, default: 0 },
    rewardTier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },

    // Referral System
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isReferralRewardClaimed: { type: Boolean, default: false },
    referralFraudScore: { type: Number, default: 0 },

    // Penalty & Account Health
    driverReliabilityScore: { type: Number, default: 100 },
    customerFraudScore: { type: Number, default: 0 },
    driverFraudScore: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
    cancellationsToday: { type: Number, default: 0 },
    lastCancellationReset: { type: Date, default: Date.now },
    
    // Customer Specific Penalty & Restrictions System
    restrictionLevel: { 
        type: String, 
        enum: ['Normal', 'Warning', 'Restricted', 'Cooldown', 'Blocked'], 
        default: 'Normal' 
    },
    suspensionStatus: { type: Boolean, default: false },
    unpaidPenaltyAmount: { type: Number, default: 0 },
    cancellationCount: { type: Number, default: 0 },
    noShowCount: { type: Number, default: 0 },

    // Wallet Dues
    walletBalance: { type: Number, default: 0 },
    pendingDues: { type: Number, default: 0 },
    deviceFingerprint: { type: String, default: '' },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
