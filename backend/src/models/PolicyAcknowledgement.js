const mongoose = require('mongoose');

const policyAcknowledgementSchema = new mongoose.Schema({
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ESGPolicy',
    required: true,
    index: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  acknowledgedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Acknowledged'],
    default: 'Acknowledged',
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate acknowledgements
policyAcknowledgementSchema.index({ policy: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('PolicyAcknowledgement', policyAcknowledgementSchema);
