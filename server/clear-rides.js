require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const clearRides = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await Booking.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} rides.`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error clearing rides:', err);
        process.exit(1);
    }
};

clearRides();
