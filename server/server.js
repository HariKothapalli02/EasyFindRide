const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Socket store
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // Driver location updates
    socket.on('driver:location:update', (data) => {
        const { driverId, lat, lng, heading, speed, rideId } = data;
        // Broadcast to specific ride room if ride is active
        if (rideId) {
            io.to(`ride:${rideId}`).emit('driver:location:broadcast', {
                driverId,
                lat,
                lng,
                heading,
                speed,
                timestamp: new Date()
            });
        }
    });

    // Customer tracking room
    socket.on('customer:track:ride', (rideId) => {
        socket.join(`ride:${rideId}`);
        console.log(`Socket ${socket.id} started tracking ride ${rideId}`);
    });

    // --- Cab Pool Sockets ---
    socket.on('poolRide:join', (poolRideId) => {
        socket.join(`poolRide:${poolRideId}`);
        console.log(`Socket ${socket.id} joined poolRide room ${poolRideId}`);
    });

    socket.on('poolRide:location:update', (data) => {
        const { poolRideId, driverId, lat, lng } = data;
        io.to(`poolRide:${poolRideId}`).emit('poolRide:driverLocation', {
            driverId,
            lat,
            lng,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        userSockets.forEach((value, key) => {
            if (value === socket.id) userSockets.delete(key);
        });
        console.log('User disconnected');
    });
});

// Export io for use in routes
app.set('io', io);
app.set('userSockets', userSockets);

// Connect to MongoDB with optimized settings for serverless
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            bufferCommands: false, // Disable buffering for clearer errors in serverless
        });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const poolRideRoutes = require('./routes/poolRideRoutes');
const adminRoutes = require('./routes/admin');
const reviewsRoutes = require('./routes/reviews');
const loyaltyRoutes = require('./routes/loyalty');
const referralRoutes = require('./routes/referrals');
const penaltyRoutes = require('./routes/penalties');
const walletRoutes = require('./routes/wallet');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/pool-rides', poolRideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/wallet', walletRoutes);

// Export the app for Vercel
module.exports = app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
