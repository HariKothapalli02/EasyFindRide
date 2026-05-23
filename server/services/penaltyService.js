const Booking = require('../models/Booking');
const User = require('../models/User');
const walletService = require('./walletService');
const mongoose = require('mongoose');

class PenaltyService {
    /**
     * Calculates dynamic cancellation fees based on travel, timing, weather, and demand
     */
    calculateCancellationFee(booking, cancelledBy) {
        if (cancelledBy !== 'customer') return 0;

        const now = new Date();
        const bookingTime = new Date(booking.date);
        const elapsedSeconds = (now.getTime() - bookingTime.getTime()) / 1000;

        // 1. Grace Period (Free cancellation within 2 minutes)
        if (elapsedSeconds <= 120) {
            console.log(`[PENALTY] Free cancellation within 2 minute grace period.`);
            return 0;
        }

        // 2. Driver reached pickup location (Arrived)
        if (booking.driverArrivedTime) {
            console.log(`[PENALTY] Driver reached pickup location. Max standard cancellation fee charged.`);
            return 50; 
        }

        // 3. Driver assigned but en route (Dynamic Calculation)
        if (booking.driverId) {
            const baseFee = 20;
            const distancePenalty = Math.round((booking.driverWastedDistance || 0) * 10); // ₹10 per km
            const timePenalty = Math.round((booking.waitDuration || 0) * 2); // ₹2 per min wait
            
            let surchargeMultiplier = 1.0;
            if (booking.isSurgeActive) surchargeMultiplier += 0.25; // +25% surge fee
            if (booking.weatherCondition && booking.weatherCondition !== 'Normal') surchargeMultiplier += 0.15; // +15% weather

            const rawFee = (baseFee + distancePenalty + timePenalty) * surchargeMultiplier;
            const finalFee = Math.min(Math.round(rawFee), 100); // capped at max ₹100
            
            console.log(`[PENALTY] Dynamic customer fee: Base ${baseFee} + DistPen ${distancePenalty} + TimePen ${timePenalty} x Multi ${surchargeMultiplier} = Final ₹${finalFee}`);
            return finalFee;
        }

        // Default standard cancellation after grace period (no driver assigned yet)
        return 15;
    }

    /**
     * Process customer cancellation, debits customer wallet, compensates driver
     */
    async handleCustomerCancellation(bookingId, reason = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error('Booking not found');
            if (booking.status === 'completed' || booking.status === 'cancelled') {
                throw new Error('Cannot cancel a ride that is already completed or cancelled');
            }

            // 1. Compute Fee
            const fee = this.calculateCancellationFee(booking, 'customer');

            // 2. Update booking status
            booking.status = 'cancelled';
            booking.cancellationFee = fee;
            booking.cancellationReason = reason;
            booking.cancelledBy = 'customer';
            booking.cancellationTime = new Date();

            // 3. Auto-deduct from customer wallet
            if (fee > 0) {
                await walletService.chargePenalty(
                    booking.userId,
                    fee,
                    booking._id,
                    `Cancellation penalty for ride ${booking._id}`
                );

                // 4. Compensate Driver (70% of fee goes to driver)
                if (booking.driverId) {
                    const compensation = Math.round(fee * 0.70);
                    if (compensation > 0) {
                        booking.cancellationCompensated = true;
                        await walletService.compensateDriver(
                            booking.driverId,
                            compensation,
                            booking._id,
                            `Compensation for customer cancellation of ride ${booking._id}`
                        );
                        console.log(`[PENALTY] Compensated driver ${booking.driverId} with ₹${compensation}`);
                    }
                }
            }

            await booking.save({ session });
            await session.commitTransaction();
            session.endSession();

            console.log(`[PENALTY] Customer cancelled booking ${bookingId}. Dynamic Fee Charged: ₹${fee}`);
            return booking;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[PENALTY_ERROR] Customer cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Process driver cancellation, increments daily cancellation counts, charges driver if over limit, adjusts reliability score
     */
    async handleDriverCancellation(bookingId, driverId, reason = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error('Booking not found');

            const driver = await User.findById(driverId).session(session);
            if (!driver || driver.role !== 'driver') throw new Error('Driver not found');

            // Reset cancellations today if 24 hours elapsed
            const now = new Date();
            const lastReset = new Date(driver.lastCancellationReset || now);
            if (now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000) {
                driver.cancellationsToday = 0;
                driver.lastCancellationReset = now;
            }

            // 1. Increment driver's cancellations today
            driver.cancellationsToday = (driver.cancellationsToday || 0) + 1;

            let penaltyCharged = 0;
            let scoreReduction = 5; // Default score reduction
            let penaltyDesc = 'Cancellation penalty';

            // 2. Penalty logic (Limit: 2 free cancellations per day)
            if (driver.cancellationsToday > 2) {
                penaltyCharged = 20; // ₹20 monetary penalty
                scoreReduction = 8;  // Excessive cancellations reduce score faster
                penaltyDesc = `Penalty for excessive driver cancellations today (${driver.cancellationsToday} cancellations)`;
                
                await walletService.chargePenalty(
                    driverId,
                    penaltyCharged,
                    booking._id,
                    penaltyDesc
                );
            }

            // 3. Update Driver's Reliability Score
            const oldScore = driver.driverReliabilityScore || 100;
            const newScore = Math.max(oldScore - scoreReduction, 0);
            driver.driverReliabilityScore = newScore;

            // 4. Score actions (suspension thresholds)
            if (newScore < 60) {
                driver.isFrozen = true;
                driver.isOnline = false;
                console.log(`[SUSPENSION] Driver ${driverId} suspended. Reliability Score dropped to ${newScore}%`);
            }

            await driver.save({ session });

            // 5. Update booking status (re-dispatch or mark cancelled)
            booking.status = 'cancelled';
            booking.cancelledBy = 'driver';
            booking.cancellationReason = reason;
            booking.cancellationTime = new Date();
            booking.cancellationFee = penaltyCharged; // Storing the penalty charged on the booking log
            
            await booking.save({ session });
            await session.commitTransaction();
            session.endSession();

            console.log(`[PENALTY] Driver ${driver.name} cancelled booking ${bookingId}. Reliability: ${oldScore}% -> ${newScore}%. Dues Charged: ₹${penaltyCharged}`);
            return { booking, driverStats: { reliabilityScore: newScore, cancellationsToday: driver.cancellationsToday, isSuspended: driver.isFrozen } };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[PENALTY_ERROR] Driver cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Lowers priority of drivers with low reliability scores (used in ride dispatches matching)
     */
    shouldPrioritizeDriver(reliabilityScore) {
        // Drivers with score < 80 get lower priority
        return reliabilityScore >= 80;
    }
}

module.exports = new PenaltyService();
