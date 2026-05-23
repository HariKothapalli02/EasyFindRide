const User = require('../models/User');
const Booking = require('../models/Booking');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const mongoose = require('mongoose');

class LoyaltyService {
    /**
     * Calculates base points based on ride fare
     */
    calculatePoints(price) {
        if (price < 100) return 5;
        if (price >= 100 && price < 300) return 10;
        return 20; // 300+
    }

    /**
     * Calculates and grants points to customer upon successful ride completion
     */
    async grantPoints(userId, bookingId, price) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');
            
            // Check if user is fraud-flagged / frozen
            if (user.isFrozen) {
                console.log(`[LOYALTY] Blocked points grant for frozen user: ${userId}`);
                await session.commitTransaction();
                session.endSession();
                return user;
            }

            // 1. Calculate Base Points
            let earned = this.calculatePoints(price);
            let description = `Base points for completed ride (Fare: ₹${price})`;
            
            // 2. Check for Daily Booking Streak (Rides on consecutive days)
            const streakBonus = await this.checkStreakBonus(userId, session);
            if (streakBonus > 0) {
                earned += streakBonus;
                description += ` + ${streakBonus} Streak Bonus`;
            }

            // 3. Check for Weekly Milestone (5 rides in last 7 days)
            const milestoneBonus = await this.checkMilestoneBonus(userId, session);
            if (milestoneBonus > 0) {
                earned += milestoneBonus;
                description += ` + ${milestoneBonus} Weekly Milestone Bonus`;
            }

            // 4. Update User Model
            user.loyaltyPoints = (user.loyaltyPoints || 0) + earned;
            user.totalEarnedPoints = (user.totalEarnedPoints || 0) + earned;

            // 5. Update Reward Tier
            const total = user.totalEarnedPoints;
            if (total >= 1000) user.rewardTier = 'Platinum';
            else if (total >= 300) user.rewardTier = 'Gold';
            else if (total >= 100) user.rewardTier = 'Silver';
            else user.rewardTier = 'Bronze';

            await user.save({ session });

            // 6. Log Loyalty Transaction
            const transaction = new LoyaltyTransaction({
                userId,
                points: earned,
                type: 'earn',
                bookingId,
                description
            });
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[LOYALTY] Granted ${earned} points to user ${userId}. Description: ${description}`);
            return user;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[LOYALTY_ERROR] Failed to grant points:', error);
            throw error;
        }
    }

    /**
     * Checks if referrer or new user qualifies for daily streak bonus (+5 points)
     */
    async checkStreakBonus(userId, session) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // Find if they had any completed ride yesterday and the day before yesterday
        const yesterdayRide = await Booking.findOne({
            userId,
            status: 'completed',
            date: { $gte: oneDayAgo, $lt: now }
        }).session(session);

        const dayBeforeYesterdayRide = await Booking.findOne({
            userId,
            status: 'completed',
            date: { $gte: twoDaysAgo, $lt: oneDayAgo }
        }).session(session);

        if (yesterdayRide && dayBeforeYesterdayRide) {
            return 5; // +5 points daily streak bonus
        }
        return 0;
    }

    /**
     * Checks if user qualifies for weekly milestone bonus (+15 points for 5 rides in 7 days)
     */
    async checkMilestoneBonus(userId, session) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const completedCount = await Booking.countDocuments({
            userId,
            status: 'completed',
            date: { $gte: sevenDaysAgo }
        }).session(session);

        // If this ride completes their 5th ride this week, grant milestone
        if (completedCount > 0 && completedCount % 5 === 0) {
            return 15; // +15 points milestone bonus
        }
        return 0;
    }

    /**
     * Redeems points for dynamic wallet discounts
     */
    async redeemPoints(userId, pointsToRedeem) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            if (user.isFrozen) throw new Error('Account is frozen. Loyalty redemption blocked.');
            if ((user.loyaltyPoints || 0) < pointsToRedeem) {
                throw new Error('Insufficient loyalty points for redemption');
            }

            // Map Redemption Points to Cash discount values
            let discountAmount = 0;
            if (pointsToRedeem === 50) discountAmount = 25;
            else if (pointsToRedeem === 100) discountAmount = 60;
            else if (pointsToRedeem === 250) discountAmount = 175;
            else {
                throw new Error('Invalid points redemption packet select. Options are 50, 100, 250.');
            }

            // Update user balance
            user.loyaltyPoints -= pointsToRedeem;
            user.redeemedPoints = (user.redeemedPoints || 0) + pointsToRedeem;
            
            // Adjust wallet balance by adding the discount amount
            user.walletBalance = (user.walletBalance || 0) + discountAmount;
            
            await user.save({ session });

            // Log Transaction
            const transaction = new LoyaltyTransaction({
                userId,
                points: -pointsToRedeem,
                type: 'redeem',
                description: `Redeemed ${pointsToRedeem} points for ₹${discountAmount} wallet discount`
            });
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[LOYALTY] Redeemed ${pointsToRedeem} points for user ${userId}. Wallet balance credited with ₹${discountAmount}.`);
            return { user, discountAmount };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[LOYALTY_ERROR] Failed to redeem points:', error);
            throw error;
        }
    }
}

module.exports = new LoyaltyService();
