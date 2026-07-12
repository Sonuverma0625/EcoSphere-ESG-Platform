const mongoose = require('mongoose');
const User = require('../models/User');
const XPTransaction = require('../models/XPTransaction');
const { getSettings } = require('./settingsService');
const { checkAndAwardBadges } = require('./badgeService');

/**
 * Log an XP or Point transaction and update User balances atomically
 * @param {string} userId - Target User ID
 * @param {number} amount - XP or points amount (can be positive or negative)
 * @param {string} type - 'Challenge', 'CSR', 'RewardRedemption', 'Manual'
 * @param {string} description - Log description
 * @param {string} [referenceId] - Associated entity ID
 * @returns {Promise<object>} Updated User document
 */
const adjustUserPoints = async (userId, amount, type, description, referenceId = null) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Log transaction
    const transaction = await XPTransaction.create([{
      user: userId,
      amount,
      type,
      description,
      referenceId
    }], { session });

    // 2. Determine fields to increment
    const updateFields = {};
    if (type === 'Challenge') {
      updateFields.xpCurrent = amount;
      updateFields.xpLifetime = amount > 0 ? amount : 0;
      updateFields.challengeXp = amount > 0 ? amount : 0;
    } else if (type === 'CSR') {
      updateFields.xpCurrent = amount;
      updateFields.xpLifetime = amount > 0 ? amount : 0;
      updateFields.csrPoints = amount; // CSR activities award CSR points too
    } else if (type === 'RewardRedemption') {
      updateFields.xpCurrent = amount; // Deduct current balance
      updateFields.xpUsed = Math.abs(amount); // Track used balance
      updateFields.csrPoints = amount; // Deduct CSR points if they are used as redemptions
    } else if (type === 'Manual') {
      updateFields.xpCurrent = amount;
      updateFields.xpLifetime = amount > 0 ? amount : 0;
    }

    // 3. Atomically update user balance
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: updateFields },
      { new: true, runValidators: true, session }
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Check boundary constraints (prevent negative balances)
    if (user.xpCurrent < 0 || user.csrPoints < 0) {
      throw new Error('Transaction aborted: Insufficient point balance');
    }

    await session.commitTransaction();
    session.endSession();

    // Check Badge auto-awards after session is closed
    const settings = await getSettings();
    if (settings.badgeAutoAward) {
      // Import badge check and run it asynchronously
      checkAndAwardBadges(userId).catch(err => {
        console.error(`[Badge Award Error] Failed for User ${userId}: ${err.message}`);
      });
    }

    return user;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  adjustUserPoints
};
