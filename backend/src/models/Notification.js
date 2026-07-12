const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'Compliance',
      'CSR',
      'Challenge',
      'Policy',
      'Badge',
      'Reward',
      'Goal',
      'Audit'
    ],
    required: true,
    index: true
  },
  relatedEntityType: {
    type: String,
    trim: true
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
