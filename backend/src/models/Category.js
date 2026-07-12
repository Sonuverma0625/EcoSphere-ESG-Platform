const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['CSR Activity', 'Challenge', 'Compliance'],
    index: true
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

// Compound index to prevent duplicate category names within the same type
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
