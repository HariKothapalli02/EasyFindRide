const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pickup: { type: String, required: true },
    pickupCoords: {
        lat: { type: Number },
        lng: { type: Number }
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
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
