const mongoose = require('mongoose');

const esgPolicySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  policyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  effectiveDate: {
    type: Date,
    required: true,
    index: true
  },
  reviewDate: {
    type: Date,
    required: true
  },
  documentAttachment: {
    type: String,
    trim: true
  },
  requiredAcknowledgement: {
    type: Boolean,
    default: true
  },
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ESGPolicy', esgPolicySchema);
