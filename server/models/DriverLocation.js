const mongoose = require('mongoose');

const DriverLocationSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

// Create geospatial index for nearby search
DriverLocationSchema.index({ location: '2dsphere', isOnline: 1 });
DriverLocationSchema.index({ driverId: 1 });

module.exports = mongoose.model('DriverLocation', DriverLocationSchema);
