const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
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
  xp: {
    type: Number,
    required: true,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
    default: 'Medium',
    index: true
  },
  evidenceRequired: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  deadline: {
    type: Date,
    required: true,
    index: true
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'],
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

module.exports = mongoose.model('Challenge', challengeSchema);
