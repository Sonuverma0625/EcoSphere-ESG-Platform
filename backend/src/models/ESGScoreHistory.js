const mongoose = require('mongoose');

const esgScoreHistorySchema = new mongoose.Schema({
  organizationScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  environmentalScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  socialScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  governanceScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  period: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ESGScoreHistory', esgScoreHistorySchema);
