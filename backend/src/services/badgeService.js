const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

/**
 * Check and automatically award qualifying badges to a user
 * @param {string} userId - User ID
 */
const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Gather User achievements
    const completedChallengesCount = await ChallengeParticipation.countDocuments({
      employee: userId,
      approvalStatus: 'Approved'
    });

    const completedCSRCount = await EmployeeParticipation.countDocuments({
      employee: userId,
      approvalStatus: 'Approved'
    });

    // 2. Fetch all active badges
    const allBadges = await Badge.find({ status: 'Active' });

    // 3. Fetch badges the user already unlocked
    const unlockedBadges = await UserBadge.find({ user: userId });
    const unlockedBadgeIds = new Set(unlockedBadges.map(ub => ub.badge.toString()));

    for (const badge of allBadges) {
      if (unlockedBadgeIds.has(badge._id.toString())) {
        continue; // Already awarded
      }

      let qualifies = false;
      const threshold = badge.unlockThreshold;

      if (badge.unlockMetric === 'TotalXP') {
        qualifies = user.xpLifetime >= threshold;
      } else if (badge.unlockMetric === 'CompletedChallenges') {
        qualifies = completedChallengesCount >= threshold;
      } else if (badge.unlockMetric === 'CompletedCSR') {
        qualifies = completedCSRCount >= threshold;
      }

      if (qualifies) {
        // Award badge!
        try {
          await UserBadge.create({
            user: userId,
            badge: badge._id,
            awardedAt: new Date()
          });

          // Send notification
          await createNotification({
            userId,
            title: 'New Badge Unlocked!',
            message: `Congratulations! You unlocked the "${badge.name}" badge. ${badge.description}`,
            type: 'Badge',
            relatedEntityType: 'Badge',
            relatedEntityId: badge._id
          });

          console.log(`[Badge Awarded] User: ${userId} | Badge: ${badge.name}`);
        } catch (dbErr) {
          // Handle compound index duplicate collision silently
          if (dbErr.code !== 11000) {
            console.error(`[Badge Award Error] Unique insert failed: ${dbErr.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`[Badge Service Error] failed for user ${userId}: ${error.message}`);
  }
};

module.exports = {
  checkAndAwardBadges
};
