const mongoose = require('mongoose');
const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const User = require('../models/User');
const { adjustUserPoints } = require('../services/xpService');
const { createNotification } = require('../services/notificationService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get active rewards
// @route   GET /api/rewards
// @access  Private
const getRewards = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name', 'description']);

    // Non-admins only see Active rewards
    if (req.user.role !== 'Admin' && req.user.role !== 'ESG Manager') {
      filter.status = 'Active';
    }

    const rewards = await Reward.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Reward.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        rewards,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Reward Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving rewards'
    });
  }
};

// @desc    Get single reward
// @route   GET /api/rewards/:id
// @access  Private
const getRewardById = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.error(`[Reward GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching reward details'
    });
  }
};

// @desc    Create reward
// @route   POST /api/rewards
// @access  Private (Admin Only)
const createReward = async (req, res) => {
  try {
    const { name, description, pointsRequired, availableStock, status } = req.body;

    // Duplication check
    const duplicate = await Reward.findOne({ name });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A reward named "${name}" already exists`
      });
    }

    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const reward = await Reward.create({
      name,
      description,
      pointsRequired: Number(pointsRequired),
      availableStock: Number(availableStock),
      status: status || 'Active',
      image: imagePath
    });

    return res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      data: reward
    });
  } catch (error) {
    console.error(`[Reward Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating reward'
    });
  }
};

// @desc    Update reward
// @route   PUT /api/rewards/:id
// @access  Private (Admin Only)
const updateReward = async (req, res) => {
  try {
    const { name, description, pointsRequired, availableStock, status } = req.body;
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (name) {
      if (name !== reward.name) {
        const conflict = await Reward.findOne({ name });
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `A reward named "${name}" already exists`
          });
        }
        reward.name = name;
      }
    }

    if (description !== undefined) reward.description = description;
    if (pointsRequired !== undefined) reward.pointsRequired = Number(pointsRequired);
    if (availableStock !== undefined) reward.availableStock = Number(availableStock);
    if (status !== undefined) reward.status = status;

    if (req.file) {
      reward.image = `/uploads/${req.file.filename}`;
    }

    await reward.save();

    return res.status(200).json({
      success: true,
      message: 'Reward updated successfully',
      data: reward
    });
  } catch (error) {
    console.error(`[Reward Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating reward details'
    });
  }
};

// @desc    Delete reward
// @route   DELETE /api/rewards/:id
// @access  Private (Admin Only)
const deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    const hasRedemptions = await RewardRedemption.exists({ reward: req.params.id });
    if (hasRedemptions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete reward: Active redemption records exist'
      });
    }

    await Reward.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error(`[Reward Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting reward'
    });
  }
};

// @desc    Redeem reward (Atomic ledger transactions)
// @route   POST /api/rewards/:id/redeem
// @access  Private (Employee Only)
const redeemReward = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const employeeId = req.user._id;
    const reward = await Reward.findById(req.params.id).session(session);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (reward.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'This reward is currently inactive'
      });
    }

    // Verify stock availability
    if (reward.availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward out of stock'
      });
    }

    // Check user points balance (Re-fetch user within transaction session)
    const user = await User.findById(employeeId).session(session);
    if (user.xpCurrent < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points balance. Required: ${reward.pointsRequired} XP, Available: ${user.xpCurrent} XP`
      });
    }

    // Deduct stock atomically
    reward.availableStock -= 1;
    await reward.save({ session });

    // Create redemption record
    const redemption = await RewardRedemption.create([{
      employee: employeeId,
      reward: reward._id,
      pointsDeducted: reward.pointsRequired,
      status: 'Requested',
      notes: req.body.notes || ''
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Deduct user points and log transaction (uses its own transaction boundary)
    await adjustUserPoints(
      employeeId,
      -reward.pointsRequired, // negative deduction
      'RewardRedemption',
      `Redeemed Reward: ${reward.name}`,
      redemption[0]._id
    );

    // Send notifications
    await createNotification({
      userId: employeeId,
      title: 'Reward Requested',
      message: `Your request for "${reward.name}" has been received. Deducted ${reward.pointsRequired} XP.`,
      type: 'Reward',
      relatedEntityType: 'RewardRedemption',
      relatedEntityId: redemption[0]._id
    });

    return res.status(201).json({
      success: true,
      message: 'Reward requested successfully. Check notifications.',
      data: redemption[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`[Reward Redeem Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Failed to redeem reward: ${error.message}`
    });
  }
};

// @desc    Get all redemptions (Review list)
// @route   GET /api/rewards/redemptions/all
// @access  Private (Admin or ESG Manager Only)
const getRedemptionsList = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query);

    // If Employee, restrict to their own redemptions
    if (req.user.role === 'Employee') {
      filter.employee = req.user._id;
    }

    const redemptions = await RewardRedemption.find(filter)
      .populate('employee', 'name email department')
      .populate('reward', 'name pointsRequired')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await RewardRedemption.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        redemptions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Redemptions Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading redemptions log'
    });
  }
};

// @desc    Review redemption request status (Admin/Manager approves/rejects)
// @route   POST /api/rewards/redemptions/:id/review
// @access  Private (Admin or ESG Manager Only)
const reviewRedemption = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const redemption = await RewardRedemption.findById(req.params.id)
      .populate('reward')
      .populate('employee', 'name email');

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption record not found'
      });
    }

    if (redemption.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `This redemption is already in status: ${redemption.status}`
      });
    }

    redemption.status = status;
    redemption.notes = notes || '';
    await redemption.save();

    // If Rejected, refund the user points atomically!
    if (status === 'Rejected' || status === 'Cancelled') {
      // Re-increment stock
      await Reward.findByIdAndUpdate(redemption.reward._id, { $inc: { availableStock: 1 } });

      // Re-credit points
      await adjustUserPoints(
        redemption.employee._id,
        redemption.pointsDeducted, // positive refund
        'Manual',
        `Refund for Rejected Reward Redemption: ${redemption.reward.name}`,
        redemption._id
      );
    }

    // Send status notification
    await createNotification({
      userId: redemption.employee._id,
      title: `Reward Request Update`,
      message: `Your request for "${redemption.reward.name}" was ${status}. Notes: ${notes || 'None'}`,
      type: 'Reward',
      relatedEntityType: 'RewardRedemption',
      relatedEntityId: redemption._id
    });

    return res.status(200).json({
      success: true,
      message: `Redemption status updated to ${status}`,
      data: redemption
    });
  } catch (error) {
    console.error(`[Redemption Review Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error reviewing redemption request'
    });
  }
};

module.exports = {
  getRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getRedemptionsList,
  reviewRedemption
};
