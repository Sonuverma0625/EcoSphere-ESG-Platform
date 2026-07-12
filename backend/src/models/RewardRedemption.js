const mongoose = require('mongoose');

const rewardRedemptionSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true,
    index: true
  },
  pointsDeducted: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'],
    default: 'Requested',
    index: true
  },
  redemptionDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
