const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  unlockMetric: {
    type: String,
    enum: ['TotalXP', 'CompletedChallenges', 'CompletedCSR'],
    required: true,
    index: true
  },
  unlockThreshold: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema);
