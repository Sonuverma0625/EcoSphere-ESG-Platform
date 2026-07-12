const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
