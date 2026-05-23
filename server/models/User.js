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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
