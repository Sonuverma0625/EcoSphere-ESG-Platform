const mongoose = require('mongoose');

const complianceIssueSchema = new mongoose.Schema({
  auditReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit',
    default: null,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    default: 'Medium',
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  resolutionNotes: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplianceIssue', complianceIssueSchema);
