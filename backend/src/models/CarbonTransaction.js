const mongoose = require('mongoose');

const carbonTransactionSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  sourceModule: {
    type: String,
    required: true,
    enum: ['Purchase', 'Manufacturing', 'Expense', 'Fleet', 'Manual', 'Facility', 'Travel'],
    index: true
  },
  activityQuantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: false,
    default: 'kWh'
  },
  emissionFactor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmissionFactor',
    default: null
  },
  calculatedEmission: {
    type: Number,
    required: true
  },
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isManual: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarbonTransaction', carbonTransactionSchema);
