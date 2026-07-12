const User = require('../models/User');
const UserBadge = require('../models/UserBadge');
const ChallengeParticipation = require('../models/ChallengeParticipation');

// @desc    Get organization-wide leaderboard
// @route   GET /api/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const { department, period } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const userFilter = { status: 'Active' };
    if (department) {
      userFilter.department = department;
    }

    // Get users sorted by lifetime XP
    const users = await User.find(userFilter)
      .select('name email department xpLifetime xpCurrent csrPoints challengeXp')
      .populate('department', 'name code')
      .sort({ xpLifetime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(userFilter);

    // Enrich each user with badge count and completed challenges
    const leaderboard = await Promise.all(
      users.map(async (user, index) => {
        const badgeCount = await UserBadge.countDocuments({ user: user._id });
        const completedChallenges = await ChallengeParticipation.countDocuments({
          employee: user._id,
          approvalStatus: 'Approved'
        });

        return {
          rank: skip + index + 1,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            department: user.department
          },
          xpLifetime: user.xpLifetime,
          xpCurrent: user.xpCurrent,
          csrPoints: user.csrPoints,
          challengeXp: user.challengeXp,
          badgeCount,
          completedChallenges,
          isCurrentUser: user._id.toString() === req.user._id.toString()
        };
      })
    );

    // Find current user's rank if not in visible list
    let currentUserRank = null;
    const currentUserInList = leaderboard.find(e => e.isCurrentUser);
    if (!currentUserInList) {
      const allUsers = await User.find({ status: 'Active' })
        .select('_id xpLifetime')
        .sort({ xpLifetime: -1 });
      
      const userIndex = allUsers.findIndex(u => u._id.toString() === req.user._id.toString());
      currentUserRank = userIndex >= 0 ? userIndex + 1 : null;
    }

    return res.status(200).json({
      success: true,
      data: {
        leaderboard,
        currentUserRank: currentUserInList ? currentUserInList.rank : currentUserRank,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Leaderboard Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading leaderboard'
    });
  }
};

module.exports = {
  getLeaderboard
};
