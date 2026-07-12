const mongoose = require('mongoose');

const xpTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Challenge', 'CSR', 'RewardRedemption', 'Manual'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('XPTransaction', xpTransactionSchema);
