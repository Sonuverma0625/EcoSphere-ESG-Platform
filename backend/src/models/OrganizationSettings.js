const mongoose = require('mongoose');

const organizationSettingsSchema = new mongoose.Schema({
  orgName: {
    type: String,
    required: true,
    default: 'EcoSphere ESG'
  },
  environmentalWeight: {
    type: Number,
    required: true,
    default: 40
  },
  socialWeight: {
    type: Number,
    required: true,
    default: 30
  },
  governanceWeight: {
    type: Number,
    required: true,
    default: 30
  },
  autoEmissionCalculation: {
    type: Boolean,
    required: true,
    default: true
  },
  csrEvidenceRequired: {
    type: Boolean,
    required: true,
    default: true
  },
  badgeAutoAward: {
    type: Boolean,
    required: true,
    default: true
  },
  inAppNotificationsEnabled: {
    type: Boolean,
    required: true,
    default: true
  },
  emailNotificationsEnabled: {
    type: Boolean,
    required: true,
    default: false
  },
  complianceAlerts: {
    type: Boolean,
    required: true,
    default: true
  },
  approvalAlerts: {
    type: Boolean,
    required: true,
    default: true
  },
  policyReminders: {
    type: Boolean,
    required: true,
    default: true
  },
  badgeAlerts: {
    type: Boolean,
    required: true,
    default: true
  },
  rewardAlerts: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OrganizationSettings', organizationSettingsSchema);
