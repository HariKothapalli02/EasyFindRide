const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const mongoose = require('mongoose');

class WalletService {
    /**
     * Atomically adjusts the user's wallet balance
     */
    async adjustBalance(userId, amount, type, bookingId = null, description = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            const oldBalance = user.walletBalance || 0;
            const newBalance = oldBalance + amount;
            
            user.walletBalance = newBalance;

            // Handle pending dues mapping if negative
            if (newBalance < 0) {
                user.pendingDues = Math.abs(newBalance);
            } else {
                user.pendingDues = 0;
            }

            await user.save({ session });

            const transaction = new WalletTransaction({
                userId,
                amount,
                type,
                bookingId,
                description
            });
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[WALLET] Adjusted balance for user ${userId}: ${oldBalance} -> ${newBalance} (Diff: ${amount})`);
            return user;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[WALLET_ERROR] Failed to adjust balance:', error);
            throw error;
        }
    }

    /**
     * Deducts penalty from user, supporting negative balances down to -150
     */
    async chargePenalty(userId, penaltyAmount, bookingId = null, description = '') {
        // Charging penalty is a negative adjustment
        const debitAmount = -Math.abs(penaltyAmount);
        return this.adjustBalance(userId, debitAmount, 'penalty', bookingId, description);
    }

    /**
     * Compensates a driver (e.g. customer cancellation payout)
     */
    async compensateDriver(driverId, compensationAmount, bookingId, description = '') {
        const creditAmount = Math.abs(compensationAmount);
        return this.adjustBalance(driverId, creditAmount, 'compensation', bookingId, description);
    }

    /**
     * Manually pays off pending dues and resets negative wallet balance
     */
    async clearDues(userId, paymentAmount) {
        const creditAmount = Math.abs(paymentAmount);
        return this.adjustBalance(userId, creditAmount, 'credit', null, 'Manual clearance of pending dues');
    }

    /**
     * Blocks users if their pending dues exceed the allowed limit (default -₹150)
     */
    async checkWalletLimit(userId, maxNegativeLimit = -150) {
        const user = await User.findById(userId);
        if (!user) return false;
        
        // Block if balance is less than allowed negative limit
        if (user.walletBalance < maxNegativeLimit) {
            return {
                isBlocked: true,
                balance: user.walletBalance,
                dues: user.pendingDues,
                msg: `Account suspended. Outstanding dues (₹${user.pendingDues}) exceed the allowed threshold (₹${Math.abs(maxNegativeLimit)}). Please clear dues to continue booking.`
            };
        }
        return { isBlocked: false, balance: user.walletBalance, dues: user.pendingDues };
    }
}

module.exports = new WalletService();
