const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
    index: true
  },
  awardedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate badge allocations
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model('UserBadge', userBadgeSchema);
