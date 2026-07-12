const mongoose = require('mongoose');

const emissionFactorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  activityType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  factorValue: {
    type: Number,
    required: true
  },
  co2EquivalentUnit: {
    type: String,
    required: true,
    default: 'kgCO2e'
  },
  source: {
    type: String,
    trim: true
  },
  effectiveDate: {
    type: Date,
    required: true,
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

module.exports = mongoose.model('EmissionFactor', emissionFactorSchema);
