const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pickup: { type: String, required: true },
    pickupCoords: {
        lat: { type: Number },
        lng: { type: Number }
    },
    pickupLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] } // [lng, lat]
    },
    drop: { type: String, required: true },
    dropCoords: {
        lat: { type: Number },
        lng: { type: Number }
    },
    vehicleType: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'picked-up', 'ongoing', 'completed', 'cancelled'], default: 'pending' },
    city: { type: String, default: 'Hyderabad' },
    
    // Cancellation & Penalty Parameters
    cancellationFee: { type: Number, default: 0 },
    cancellationReason: { type: String, default: '' },
    cancelledBy: { type: String, enum: ['customer', 'driver', 'system', ''], default: '' },
    cancellationTime: { type: Date },
    driverAssignedTime: { type: Date },
    driverArrivedTime: { type: Date },
    driverWastedDistance: { type: Number, default: 0 }, // in km
    waitDuration: { type: Number, default: 0 }, // in minutes
    weatherCondition: { type: String, default: 'Normal' },
    isSurgeActive: { type: Boolean, default: false },
    cancellationCompensated: { type: Boolean, default: false },

    date: { type: Date, default: Date.now }
});

// Create geospatial index for nearby search
BookingSchema.index({ pickupLocation: '2dsphere' });
BookingSchema.index({ status: 1 });
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
