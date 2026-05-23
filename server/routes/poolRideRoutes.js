const express = require('express');
const router = express.Router();
const {
    createPoolRide,
    searchPoolRides,
    joinPoolRide,
    updatePassengerStatus,
    getPoolRideDetails
} = require('../controllers/poolRideController');

// Driver creates a pool route
router.post('/create', createPoolRide);

// User searches for a matching pool route
router.post('/search', searchPoolRides);

// User joins a pool ride
router.post('/:id/join', joinPoolRide);

// Driver updates a passenger's status (picked, dropped, cancelled)
router.patch('/:poolRideId/passenger/:passengerId', updatePassengerStatus);

// Get specific pool ride details
router.get('/:id', getPoolRideDetails);

module.exports = router;
