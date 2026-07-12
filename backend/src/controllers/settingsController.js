const OrganizationSettings = require('../models/OrganizationSettings');
const { getSettings } = require('../services/settingsService');
const { recalculateESGScores } = require('../services/scoreService');

// @desc    Get global organization settings
// @route   GET /api/settings
// @access  Private
const getOrgSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error(`[Settings Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching settings'
    });
  }
};

// @desc    Update global organization settings
// @route   PUT /api/settings
// @access  Private (Admin Only)
const updateOrgSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    const {
      orgName,
      environmentalWeight,
      socialWeight,
      governanceWeight,
      autoEmissionCalculation,
      csrEvidenceRequired,
      badgeAutoAward,
      inAppNotificationsEnabled,
      emailNotificationsEnabled,
      complianceAlerts,
      approvalAlerts,
      policyReminders,
      badgeAlerts,
      rewardAlerts
    } = req.body;

    // Validate weights if provided
    if (
      environmentalWeight !== undefined ||
      socialWeight !== undefined ||
      governanceWeight !== undefined
    ) {
      const eW = environmentalWeight !== undefined ? Number(environmentalWeight) : settings.environmentalWeight;
      const sW = socialWeight !== undefined ? Number(socialWeight) : settings.socialWeight;
      const gW = governanceWeight !== undefined ? Number(governanceWeight) : settings.governanceWeight;

      if (eW + sW + gW !== 100) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: The ESG weights (Environmental, Social, Governance) must sum exactly to 100%'
        });
      }

      settings.environmentalWeight = eW;
      settings.socialWeight = sW;
      settings.governanceWeight = gW;
    }

    // Apply updates
    if (orgName !== undefined) settings.orgName = orgName;
    if (autoEmissionCalculation !== undefined) settings.autoEmissionCalculation = autoEmissionCalculation;
    if (csrEvidenceRequired !== undefined) settings.csrEvidenceRequired = csrEvidenceRequired;
    if (badgeAutoAward !== undefined) settings.badgeAutoAward = badgeAutoAward;
    if (inAppNotificationsEnabled !== undefined) settings.inAppNotificationsEnabled = inAppNotificationsEnabled;
    if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
    if (complianceAlerts !== undefined) settings.complianceAlerts = complianceAlerts;
    if (approvalAlerts !== undefined) settings.approvalAlerts = approvalAlerts;
    if (policyReminders !== undefined) settings.policyReminders = policyReminders;
    if (badgeAlerts !== undefined) settings.badgeAlerts = badgeAlerts;
    if (rewardAlerts !== undefined) settings.rewardAlerts = rewardAlerts;

    await settings.save();

    // Trigger score recalculation if weights changed
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Settings update trigger: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error(`[Settings Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating settings'
    });
  }
};

module.exports = {
  getOrgSettings,
  updateOrgSettings
};
