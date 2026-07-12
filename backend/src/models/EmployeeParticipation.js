const mongoose = require('mongoose');

const employeeParticipationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  csrActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CSRActivity',
    required: true,
    index: true
  },
  proofFile: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  completionDate: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique employee participation per CSR activity
employeeParticipationSchema.index({ employee: 1, csrActivity: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeParticipation', employeeParticipationSchema);
