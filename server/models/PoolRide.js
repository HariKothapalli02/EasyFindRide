const mongoose = require('mongoose');

const poolRideSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicleType: {
        type: String,
        default: 'cab',
        enum: ['cab'] // Important: ONLY cabs
    },
    rideType: {
        type: String,
        default: 'pool',
        enum: ['pool']
    },
    startLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    endLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    startTime: {
        type: Date,
        required: true
    },
    route: {
        type: { type: String, default: 'LineString' },
        coordinates: { type: [[Number]], required: true }, // Array of [lng, lat]
        distanceKm: { type: Number, required: true },
        durationMin: { type: Number, required: true }
    },
    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    cabDetails: {
        model: { type: String, required: true },
        number: { type: String, required: true },
        color: { type: String }
    },
    passengers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        pickup: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String }
        },
        drop: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String }
        },
        requiredSeats: { type: Number },
        pickupRouteIndex: { type: Number },
        dropRouteIndex: { type: Number },
        approxPickupTime: { type: Date },
        approxDropTime: { type: Date },
        fare: { type: Number },
        status: {
            type: String,
            enum: ['booked', 'picked', 'dropped', 'cancelled'],
            default: 'booked'
        }
    }],
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    driverCurrentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, { timestamps: true });

module.exports = mongoose.model('PoolRide', poolRideSchema);
