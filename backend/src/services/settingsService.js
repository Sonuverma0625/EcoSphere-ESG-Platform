const OrganizationSettings = require('../models/OrganizationSettings');

const getSettings = async () => {
  let settings = await OrganizationSettings.findOne();
  if (!settings) {
    settings = await OrganizationSettings.create({
      orgName: 'EcoSphere ESG Platform',
      environmentalWeight: 40,
      socialWeight: 30,
      governanceWeight: 30,
      autoEmissionCalculation: true,
      csrEvidenceRequired: true,
      badgeAutoAward: true,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false
    });
  }
  return settings;
};

module.exports = {
  getSettings
};
