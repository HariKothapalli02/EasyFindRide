const User = require('../models/User');
const Referral = require('../models/Referral');
const FraudLog = require('../models/FraudLog');
const walletService = require('./walletService');
const mongoose = require('mongoose');

class ReferralService {
    /**
     * Generates a unique referral code for a user
     */
    async generateReferralCode(name) {
        const prefix = name.replace(/\s+/g, '').slice(0, 5).toUpperCase();
        let code = '';
        let exists = true;
        
        while (exists) {
            const rand = Math.floor(100 + Math.random() * 900); // 3-digit number
            code = `${prefix}${rand}`;
            const user = await User.findOne({ referralCode: code });
            if (!user) exists = false;
        }
        return code;
    }

    /**
     * Links a new signup (referee) to the code creator (referrer) with anti-fraud validations
     */
    async applyReferralCode(refereeId, referralCode, deviceFingerprint = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const referee = await User.findById(refereeId).session(session);
            if (!referee) throw new Error('Referee not found');
            if (referee.referredBy) throw new Error('You have already applied a referral code');

            const referrer = await User.findOne({ referralCode: referralCode.toUpperCase().trim() }).session(session);
            if (!referrer) throw new Error('Invalid referral code');

            if (referrer._id.toString() === refereeId.toString()) {
                throw new Error('You cannot refer yourself');
            }

            // ANTI-FRAUD CHECKS
            let isSuspicious = false;
            let fraudReason = '';

            // 1. Same Device Fingerprint
            if (deviceFingerprint && referrer.deviceFingerprint === deviceFingerprint) {
                isSuspicious = true;
                fraudReason = 'Referrer and referee share the exact same device fingerprint';
            }

            // 2. Rapid signup farming (Signups with same fingerprint under 10 mins)
            if (isSuspicious) {
                // Increment Fraud Score on both accounts
                referrer.referralFraudScore = (referrer.referralFraudScore || 0) + 50;
                referee.referralFraudScore = (referee.referralFraudScore || 0) + 50;
                
                await referrer.save({ session });
                
                // Log Fraud Entries
                const logReferrer = new FraudLog({
                    userId: referrer._id,
                    type: 'referral_abuse',
                    scoreDelta: 50,
                    details: `Referrer flagged: ${fraudReason} (Referee: ${referee.name})`,
                    deviceInfo: deviceFingerprint
                });
                await logReferrer.save({ session });

                const logReferee = new FraudLog({
                    userId: referee._id,
                    type: 'referral_abuse',
                    scoreDelta: 50,
                    details: `Referee flagged: ${fraudReason} (Referrer: ${referrer.name})`,
                    deviceInfo: deviceFingerprint
                });
                await logReferee.save({ session });
            }

            // Save relationship
            referee.referredBy = referrer._id;
            await referee.save({ session });

            const referral = new Referral({
                referrerId: referrer._id,
                refereeId: referee._id,
                referralCode: referralCode.toUpperCase().trim(),
                status: isSuspicious ? 'flagged' : 'pending'
            });
            await referral.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[REFERRAL] Applied code ${referralCode} from referrer ${referrer.name} to referee ${referee.name}. Status: ${isSuspicious ? 'FLAGGED' : 'PENDING'}`);
            return { referral, isSuspicious };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[REFERRAL_ERROR] Failed to apply referral code:', error);
            throw error;
        }
    }

    /**
     * Unlocks referral reward (₹50 each) when referee completes their first successful ride
     */
    async processFirstRideReward(refereeId, bookingId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const referee = await User.findById(refereeId).session(session);
            if (!referee || !referee.referredBy || referee.isReferralRewardClaimed) {
                await session.commitTransaction();
                session.endSession();
                return null; // Doesn't qualify
            }

            const referral = await Referral.findOne({
                referrerId: referee.referredBy,
                refereeId: referee._id
            }).session(session);

            if (!referral) {
                await session.commitTransaction();
                session.endSession();
                return null;
            }

            // Block rewards if the referral relationship is flagged or either user is frozen
            const referrer = await User.findById(referee.referredBy).session(session);
            if (referral.status === 'flagged' || referee.isFrozen || (referrer && referrer.isFrozen)) {
                console.log(`[REFERRAL] Reward payout blocked due to fraud flag. Referee: ${refereeId}, Referrer: ${referee.referredBy}`);
                referral.status = 'flagged';
                await referral.save({ session });
                await session.commitTransaction();
                session.endSession();
                return null;
            }

            // Mark claimed
            referee.isReferralRewardClaimed = true;
            await referee.save({ session });

            referral.status = 'completed';
            await referral.save({ session });

            await session.commitTransaction();
            session.endSession();

            // Payouts (₹50 to both referrers and referees)
            await walletService.adjustBalance(
                referrer._id,
                50,
                'referral_bonus',
                bookingId,
                `Referral reward for inviting ${referee.name}`
            );

            await walletService.adjustBalance(
                referee._id,
                50,
                'referral_bonus',
                bookingId,
                `Referral reward for signing up via ${referrer.name}`
            );

            console.log(`[REFERRAL] Dispatched rewards successfully to referrer ${referrer.name} and referee ${referee.name}.`);
            return { referrerPayout: 50, refereePayout: 50 };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[REFERRAL_ERROR] Payout trigger failed:', error);
            throw error;
        }
    }
}

module.exports = new ReferralService();
