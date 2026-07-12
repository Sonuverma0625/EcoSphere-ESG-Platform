const mongoose = require('mongoose');

const environmentalGoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  metric: {
    type: String,
    required: true,
    trim: true
  },
  baselineValue: {
    type: Number,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    required: true,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'At Risk'],
    default: 'Not Started',
    index: true
  },
  progressPercentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EnvironmentalGoal', environmentalGoalSchema);
