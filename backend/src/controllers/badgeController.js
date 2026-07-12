const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../services/badgeService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all badges
// @route   GET /api/badges
// @access  Private
const getBadges = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name']);

    const badges = await Badge.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Badge.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        badges,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Badge Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving badges'
    });
  }
};

// @desc    Get user badges
// @route   GET /api/badges/user/:userId
// @access  Private
const getUserBadges = async (req, res) => {
  try {
    const targetId = req.params.userId || req.user._id;

    const userBadges = await UserBadge.find({ user: targetId })
      .populate('badge')
      .sort({ awardedAt: -1 });

    return res.status(200).json({
      success: true,
      data: userBadges
    });
  } catch (error) {
    console.error(`[User Badge Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching user badges'
    });
  }
};

// @desc    Create badge
// @route   POST /api/badges
// @access  Private (Admin Only)
const createBadge = async (req, res) => {
  try {
    const { name, description, unlockMetric, unlockThreshold, status } = req.body;

    let iconPath = '';
    if (req.file) {
      iconPath = `/uploads/${req.file.filename}`;
    }

    const badge = await Badge.create({
      name,
      description,
      icon: iconPath,
      unlockMetric,
      unlockThreshold: Number(unlockThreshold),
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A badge with this name already exists'
      });
    }
    console.error(`[Badge Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating badge'
    });
  }
};

// @desc    Update badge
// @route   PUT /api/badges/:id
// @access  Private (Admin Only)
const updateBadge = async (req, res) => {
  try {
    const { name, description, unlockMetric, unlockThreshold, status } = req.body;
    const badge = await Badge.findById(req.params.id);

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    if (name !== undefined) badge.name = name;
    if (description !== undefined) badge.description = description;
    if (unlockMetric !== undefined) badge.unlockMetric = unlockMetric;
    if (unlockThreshold !== undefined) badge.unlockThreshold = Number(unlockThreshold);
    if (status !== undefined) badge.status = status;
    if (req.file) badge.icon = `/uploads/${req.file.filename}`;

    await badge.save();

    return res.status(200).json({
      success: true,
      message: 'Badge updated successfully',
      data: badge
    });
  } catch (error) {
    console.error(`[Badge Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating badge'
    });
  }
};

// @desc    Delete badge
// @route   DELETE /api/badges/:id
// @access  Private (Admin Only)
const deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    const hasAwards = await UserBadge.exists({ badge: req.params.id });
    if (hasAwards) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete badge: It has already been awarded to employees'
      });
    }

    await Badge.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Badge deleted successfully'
    });
  } catch (error) {
    console.error(`[Badge Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting badge'
    });
  }
};

// @desc    Manually award badge to a user (when auto-award is off)
// @route   POST /api/badges/award
// @access  Private (Admin Only)
const awardBadgeManually = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;

    const duplicate = await UserBadge.findOne({ user: userId, badge: badgeId });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'This user has already been awarded this badge'
      });
    }

    const userBadge = await UserBadge.create({
      user: userId,
      badge: badgeId,
      awardedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Badge manually awarded successfully',
      data: userBadge
    });
  } catch (error) {
    console.error(`[Badge Manual Award Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error awarding badge'
    });
  }
};

module.exports = {
  getBadges,
  getUserBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  awardBadgeManually
};
