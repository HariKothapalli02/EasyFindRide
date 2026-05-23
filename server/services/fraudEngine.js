const User = require('../models/User');
const FraudLog = require('../models/FraudLog');
const mongoose = require('mongoose');

class FraudEngine {
    /**
     * Increments the customer's fraud score and auto-freezes if above threshold (75)
     */
    async evaluateCustomerFraudScore(userId, scoreDelta, type, details, deviceInfo = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            const oldScore = user.customerFraudScore || 0;
            const newScore = Math.min(oldScore + scoreDelta, 100);
            user.customerFraudScore = newScore;

            // Auto-freeze if threshold (75) exceeded
            if (newScore >= 75) {
                user.isFrozen = true;
                console.log(`[FRAUD_SUSPENSION] Customer ${userId} frozen. Fraud score reached ${newScore}%`);
            }

            await user.save({ session });

            const log = new FraudLog({
                userId,
                type,
                scoreDelta,
                details: `[Customer Flag] ${details} (Score: ${oldScore} -> ${newScore})`,
                deviceInfo
            });
            await log.save({ session });

            await session.commitTransaction();
            session.endSession();

            return { score: newScore, isFrozen: user.isFrozen };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[FRAUD_ERROR] Customer evaluation failed:', error);
            throw error;
        }
    }

    /**
     * Increments the driver's fraud score and auto-freezes if above threshold (75)
     */
    async evaluateDriverFraudScore(userId, scoreDelta, type, details, deviceInfo = '') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            const oldScore = user.driverFraudScore || 0;
            const newScore = Math.min(oldScore + scoreDelta, 100);
            user.driverFraudScore = newScore;

            // Auto-freeze if threshold (75) exceeded
            if (newScore >= 75) {
                user.isFrozen = true;
                user.isOnline = false;
                console.log(`[FRAUD_SUSPENSION] Driver ${userId} frozen. Fraud score reached ${newScore}%`);
            }

            await user.save({ session });

            const log = new FraudLog({
                userId,
                type,
                scoreDelta,
                details: `[Driver Flag] ${details} (Score: ${oldScore} -> ${newScore})`,
                deviceInfo
            });
            await log.save({ session });

            await session.commitTransaction();
            session.endSession();

            return { score: newScore, isFrozen: user.isFrozen };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('[FRAUD_ERROR] Driver evaluation failed:', error);
            throw error;
        }
    }

    /**
     * Evaluates GPS logs to detect impossible teleportation speeds (GPS spoofing)
     */
    async detectGpsSpoofing(driverId, lastLoc, currentLoc) {
        if (!lastLoc || !currentLoc) return false;

        const earthRadius = 6371; // km
        const dLat = (currentLoc.lat - lastLoc.lat) * Math.PI / 180;
        const dLng = (currentLoc.lng - lastLoc.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lastLoc.lat * Math.PI / 180) * Math.cos(currentLoc.lat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
                  
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c; // in km

        const timeDiffSeconds = Math.max((new Date().getTime() - new Date(lastLoc.timestamp || Date.now()).getTime()) / 1000, 1);
        const speedKmh = (distance / timeDiffSeconds) * 3600;

        // teleports if speed is > 180 km/h (completely impossible for city driving/bikes/autos)
        if (distance > 0.5 && speedKmh > 180) {
            const details = `GPS Teleportation: Traveled ${distance.toFixed(2)}km in ${timeDiffSeconds.toFixed(1)}s (Speed: ${speedKmh.toFixed(1)} km/h)`;
            console.log(`[FRAUD_WARNING] Driver ${driverId} flagged: ${details}`);
            
            await this.evaluateDriverFraudScore(
                driverId,
                40,
                'gps_teleportation',
                details
            );
            return true;
        }
        return false;
    }

    /**
     * Checks user agents / deviceInfo for emulator and sandbox parameters
     */
    async detectEmulatorUsage(userId, userRole, deviceInfo = '') {
        const lowerDev = deviceInfo.toLowerCase();
        const emulatorIndicators = ['emulator', 'sdk', 'google_sdk', 'genymotion', 'andy', 'qemu', 'blue_stacks', 'nox'];
        
        const isEmulator = emulatorIndicators.some(ind => lowerDev.includes(ind));
        if (isEmulator) {
            const details = `Simulator/Emulator use detected: "${deviceInfo}"`;
            
            if (userRole === 'driver') {
                await this.evaluateDriverFraudScore(userId, 60, 'emulator_usage', details, deviceInfo);
            } else {
                await this.evaluateCustomerFraudScore(userId, 60, 'emulator_usage', details, deviceInfo);
            }
            return true;
        }
        return false;
    }

    /**
     * Flags and penalties multiple accounts sharing the same hardware footprint
     */
    async detectDeviceFarming(userId, userRole, deviceFingerprint = '') {
        if (!deviceFingerprint) return false;

        // Query database to find other accounts sharing fingerprint
        const sharingAccounts = await User.find({ deviceFingerprint, _id: { $ne: userId } });
        if (sharingAccounts.length >= 3) {
            const details = `Device farming footprint: Fingerprint shared with ${sharingAccounts.length} other accounts.`;
            
            // Penalize this user
            if (userRole === 'driver') {
                await this.evaluateDriverFraudScore(userId, 50, 'referral_abuse', details, deviceFingerprint);
            } else {
                await this.evaluateCustomerFraudScore(userId, 50, 'referral_abuse', details, deviceFingerprint);
            }

            // Flag the other accounts too
            for (const acct of sharingAccounts) {
                if (acct.role === 'driver') {
                    await this.evaluateDriverFraudScore(acct._id, 30, 'referral_abuse', `Farming trigger: Linked to user ${userId}`, deviceFingerprint);
                } else {
                    await this.evaluateCustomerFraudScore(acct._id, 30, 'referral_abuse', `Farming trigger: Linked to user ${userId}`, deviceFingerprint);
                }
            }
            return true;
        }
        return false;
    }
}

module.exports = new FraudEngine();
