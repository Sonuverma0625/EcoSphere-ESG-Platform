const mongoose = require('mongoose');

const challengeParticipationSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true,
    index: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  proofFile: {
    type: String,
    trim: true,
    default: ''
  },
  submissionNotes: {
    type: String,
    trim: true
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  xpAwarded: {
    type: Number,
    default: 0
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  completionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate challenge joining
challengeParticipationSchema.index({ challenge: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('ChallengeParticipation', challengeParticipationSchema);
