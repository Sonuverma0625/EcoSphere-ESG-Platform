const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
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
  pointsRequired: {
    type: Number,
    required: true,
    min: 0
  },
  availableStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Reward', rewardSchema);
