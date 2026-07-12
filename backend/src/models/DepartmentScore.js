const mongoose = require('mongoose');

const departmentScoreSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
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
  totalScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  period: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

departmentScoreSchema.index({ department: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('DepartmentScore', departmentScoreSchema);
