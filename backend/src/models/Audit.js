const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  auditTitle: {
    type: String,
    required: true,
    trim: true
  },
  auditType: {
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
  assignedAuditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
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
    enum: ['Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  scope: {
    type: String,
    trim: true
  },
  findings: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audit', auditSchema);
