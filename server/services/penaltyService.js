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

            // Update customer cancel statistics
            const customer = await User.findById(booking.userId).session(session);
            if (customer) {
                customer.cancellationCount = (customer.cancellationCount || 0) + 1;
                if (fee > 0) {
                    customer.unpaidPenaltyAmount = (customer.unpaidPenaltyAmount || 0) + fee;
                    customer.pendingDues = (customer.pendingDues || 0) + fee;
                }
                await customer.save({ session });
                await this.updateCustomerRestrictions(booking.userId, session);
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

    /**
     * Evaluates customer cancellations, no-shows, and fraud score to calculate restriction level
     */
    async updateCustomerRestrictions(userId, session = null) {
        const user = await User.findById(userId).session(session);
        if (!user) return null;

        const cancellations = user.cancellationCount || 0;
        const noShows = user.noShowCount || 0;
        const fraudScore = user.customerFraudScore || 0;

        // Dynamic Abuse Score calculation
        const abuseScore = (cancellations * 5) + (noShows * 15);
        
        let level = 'Normal';
        if (user.isFrozen || fraudScore >= 75 || abuseScore >= 90) {
            level = 'Blocked';
        } else if (abuseScore >= 75 || fraudScore >= 65) {
            level = 'Cooldown';
        } else if (abuseScore >= 50 || fraudScore >= 45) {
            level = 'Restricted';
        } else if (abuseScore >= 25 || fraudScore >= 25) {
            level = 'Warning';
        }

        user.restrictionLevel = level;
        
        // If unpaid dues are present, keep restriction in Restricted or Cooldown (escalate)
        if (user.unpaidPenaltyAmount > 0 && level === 'Normal') {
            user.restrictionLevel = 'Warning';
        }

        if (session) {
            await user.save({ session });
        } else {
            await user.save();
        }

        return user;
    }

    /**
     * Assesses whether a customer is allowed to book a ride
     */
    async validateBookingAttempt(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Check 1: Account Frozen/Blocked
        if (user.isFrozen || user.restrictionLevel === 'Blocked') {
            throw new Error('BOOKING_LOCKED: Your account is locked under administrative review due to suspicious activity or severe policy violations.');
        }

        // Check 2: Booking Cooldown active
        if (user.restrictionLevel === 'Cooldown') {
            throw new Error('BOOKING_COOLDOWN: Your account is under a temporary booking cooldown due to excessive cancellation attempts. Try again in 10 minutes.');
        }

        // Check 3: Unpaid Penalty Dues
        if ((user.unpaidPenaltyAmount || 0) > 0 || (user.pendingDues || 0) > 0) {
            const dues = Math.max(user.unpaidPenaltyAmount || 0, user.pendingDues || 0);
            throw new Error(`UNPAID_DUES: You have outstanding unpaid penalty dues of ₹${dues}. Please clear them in your 'Penalty & Restrictions' hub to book rides.`);
        }

        return true;
    }

    /**
     * Auto-cancels ride due to passenger no-show after driver waits 5 minutes
     */
    async handleCustomerNoShow(bookingId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error('Booking not found');
            if (booking.status !== 'accepted' && booking.status !== 'picked-up') {
                throw new Error('Booking must be accepted to trigger no-show.');
            }

            const customerId = booking.userId;
            const driverId = booking.driverId;

            // 1. Charge standard ₹50 no-show fee
            const noShowFee = 50;
            const customer = await User.findById(customerId).session(session);
            if (customer) {
                customer.noShowCount = (customer.noShowCount || 0) + 1;
                customer.unpaidPenaltyAmount = (customer.unpaidPenaltyAmount || 0) + noShowFee;
                customer.pendingDues = (customer.pendingDues || 0) + noShowFee;
                customer.walletBalance = (customer.walletBalance || 0) - noShowFee; // Auto-deduct wallet
                await customer.save({ session });
                
                // Adjust dynamic restriction level
                await this.updateCustomerRestrictions(customerId, session);
            }

            // 2. Compensate driver with ₹35
            if (driverId) {
                await walletService.compensateDriver(
                    driverId,
                    35,
                    booking._id,
                    `Driver compensation for customer no-show of ride ${booking._id}`,
                    session
                );
            }

            // 3. Update booking status
            booking.status = 'cancelled';
            booking.cancellationFee = noShowFee;
            booking.cancellationReason = 'Customer No-Show (Waited > 5 mins)';
            booking.cancelledBy = 'system';
            booking.cancellationTime = new Date();
            await booking.save({ session });

            // Create wallet transaction history
            const WalletTransaction = require('../models/WalletTransaction');
            const customerTx = new WalletTransaction({
                userId: customerId,
                amount: -noShowFee,
                type: 'penalty',
                bookingId: booking._id,
                description: `Penalty fee: Customer no-show for ride ${booking._id}`
            });
            await customerTx.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[NO_SHOW] Processed customer no-show for booking ${bookingId}. Fee ₹${noShowFee}`);
            return booking;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[NO_SHOW_ERROR] Failed to handle no show:', error);
            throw error;
        }
    }
}

module.exports = new PenaltyService();
