const mongoose = require('mongoose');

const csrActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  description: {
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
  location: {
    type: String,
    required: true,
    trim: true
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
  maxParticipants: {
    type: Number,
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true,
    default: 0
  },
  evidenceRequired: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CSRActivity', csrActivitySchema);
