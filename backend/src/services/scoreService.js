const User = require('../models/User');
const Department = require('../models/Department');
const CarbonTransaction = require('../models/CarbonTransaction');
const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const CSRActivity = require('../models/CSRActivity');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const ESGPolicy = require('../models/ESGPolicy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const Audit = require('../models/Audit');
const ComplianceIssue = require('../models/ComplianceIssue');
const DepartmentScore = require('../models/DepartmentScore');
const ESGScoreHistory = require('../models/ESGScoreHistory');
const { getSettings } = require('./settingsService');

/**
 * Calculate and save ESG scores for all departments and the organization for the current period (YYYY-MM).
 */
const recalculateESGScores = async () => {
  try {
    const settings = await getSettings();
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all departments
    const departments = await Department.find({ status: 'Active' });
    if (departments.length === 0) return;

    let orgWeightedE = 0;
    let orgWeightedS = 0;
    let orgWeightedG = 0;
    let totalEmployees = 0;

    const departmentScores = [];

    for (const dept of departments) {
      const deptId = dept._id;
      const empCount = await User.countDocuments({ department: deptId, status: 'Active' }) || 1;
      totalEmployees += empCount;

      // ----------------------------------------------------
      // 1. ENVIRONMENTAL SCORE (E)
      // ----------------------------------------------------
      // Metric A (40%): Emission reduction against baseline
      // Find all transactions in current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const transactions = await CarbonTransaction.find({
        department: deptId,
        transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const currentEmissions = transactions.reduce((sum, tx) => sum + tx.calculatedEmission, 0);

      // Sum of goals baseline, or fallback default
      const goals = await EnvironmentalGoal.find({ department: deptId });
      const baselineEmissions = goals.reduce((sum, g) => sum + g.baselineValue, 0) || 5000; // default 5000 kgCO2e
      
      let emissionReductionScore = 100;
      if (baselineEmissions > 0) {
        // Reduction compared to baseline. If emissions are lower, score increases.
        const reductionPercent = ((baselineEmissions - currentEmissions) / baselineEmissions) * 100;
        emissionReductionScore = Math.max(0, Math.min(100, reductionPercent > 0 ? reductionPercent : 0));
      }

      // Metric B (30%): Sustainability Goal Completion
      let goalCompletionScore = 100;
      if (goals.length > 0) {
        const totalProgress = goals.reduce((sum, g) => sum + g.progressPercentage, 0);
        goalCompletionScore = totalProgress / goals.length;
      }

      // Metric C (30%): Environmental activity completion rate
      // Find all CSR activities in the department
      const deptActivities = await CSRActivity.find({ department: deptId, status: 'Completed' });
      let envActivityScore = 100;
      if (deptActivities.length > 0) {
        // Participation rate in those activities
        let approvedCount = 0;
        let maxCount = 0;
        for (const act of deptActivities) {
          const participations = await EmployeeParticipation.countDocuments({
            csrActivity: act._id,
            approvalStatus: 'Approved'
          });
          approvedCount += participations;
          maxCount += act.maxParticipants || 1;
        }
        envActivityScore = maxCount > 0 ? (approvedCount / maxCount) * 100 : 100;
      }

      const eScore = Math.round((emissionReductionScore * 0.4) + (goalCompletionScore * 0.3) + (envActivityScore * 0.3));

      // ----------------------------------------------------
      // 2. SOCIAL SCORE (S)
      // ----------------------------------------------------
      // Metric A (40%): CSR Participation Rate
      // Approved participations / employee count
      const allApprovedCSRs = await EmployeeParticipation.countDocuments({
        approvalStatus: 'Approved',
        employee: { $in: await User.find({ department: deptId }).distinct('_id') }
      });
      const csrParticipationRate = Math.min(100, (allApprovedCSRs / empCount) * 100);

      // Metric B (30%): Training Completion rate
      // Let's proxy this with challenge completion or set a default high rating
      const trainingChallenges = await ChallengeParticipation.countDocuments({
        approvalStatus: 'Approved',
        employee: { $in: await User.find({ department: deptId }).distinct('_id') }
      });
      const trainingCompletionRate = Math.min(100, (trainingChallenges / empCount) * 100 || 80); // default 80%

      // Metric C (30%): Employee Engagement
      // Enrolled vs total active employees
      const enrolledCount = await EmployeeParticipation.find({
        employee: { $in: await User.find({ department: deptId }).distinct('_id') }
      }).distinct('employee');
      const engagementRate = Math.min(100, (enrolledCount.length / empCount) * 100);

      const sScore = Math.round((csrParticipationRate * 0.4) + (trainingCompletionRate * 0.3) + (engagementRate * 0.3));

      // ----------------------------------------------------
      // 3. GOVERNANCE SCORE (G)
      // ----------------------------------------------------
      // Metric A (35%): Policy Acknowledgement Rate
      // Acknowledged policies for department employees out of total targeted published policies
      const publishedPolicies = await ESGPolicy.find({
        status: 'Published',
        $or: [{ targetDepartments: [] }, { targetDepartments: deptId }]
      });
      let policyAckRate = 100;
      if (publishedPolicies.length > 0) {
        const totalAcks = await PolicyAcknowledgement.countDocuments({
          employee: { $in: await User.find({ department: deptId }).distinct('_id') }
        });
        const targetAcks = publishedPolicies.length * empCount;
        policyAckRate = targetAcks > 0 ? Math.min(100, (totalAcks / targetAcks) * 100) : 100;
      }

      // Metric B (35%): Compliance Resolution Rate
      const issues = await ComplianceIssue.find({ department: deptId });
      let complianceResolutionRate = 100;
      if (issues.length > 0) {
        const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
        complianceResolutionRate = (resolved / issues.length) * 100;
      }

      // Metric C (30%): Audit Completion score
      const audits = await Audit.find({ department: deptId, status: 'Completed' });
      let auditScore = 100;
      if (audits.length > 0) {
        const avgScore = audits.reduce((sum, a) => sum + (a.score || 0), 0) / audits.length;
        auditScore = avgScore;
      }

      const gScore = Math.round((policyAckRate * 0.35) + (complianceResolutionRate * 0.35) + (auditScore * 0.30));

      // ----------------------------------------------------
      // 4. DEPARTMENT TOTAL SCORE
      // ----------------------------------------------------
      const totalScore = Math.round(
        (eScore * (settings.environmentalWeight / 100)) +
        (sScore * (settings.socialWeight / 100)) +
        (gScore * (settings.governanceWeight / 100))
      );

      // Save Department Score
      await DepartmentScore.findOneAndUpdate(
        { department: deptId, period },
        {
          environmentalScore: eScore,
          socialScore: sScore,
          governanceScore: gScore,
          totalScore: totalScore
        },
        { upsert: true, new: true }
      );

      // Accumulate for Organization metrics
      orgWeightedE += (eScore * empCount);
      orgWeightedS += (sScore * empCount);
      orgWeightedG += (gScore * empCount);
    }

    // ----------------------------------------------------
    // 5. ORGANIZATION ESG SCORE HISTORY
    // ----------------------------------------------------
    const finalOrgE = Math.round(orgWeightedE / totalEmployees);
    const finalOrgS = Math.round(orgWeightedS / totalEmployees);
    const finalOrgG = Math.round(orgWeightedG / totalEmployees);

    const finalOrgScore = Math.round(
      (finalOrgE * (settings.environmentalWeight / 100)) +
      (finalOrgS * (settings.socialWeight / 100)) +
      (finalOrgG * (settings.governanceWeight / 100))
    );

    await ESGScoreHistory.findOneAndUpdate(
      { period },
      {
        organizationScore: finalOrgScore,
        environmentalScore: finalOrgE,
        socialScore: finalOrgS,
        governanceScore: finalOrgG
      },
      { upsert: true, new: true }
    );

    console.log(`[ESG Score Calc] Recalculated for period ${period}: E:${finalOrgE} S:${finalOrgS} G:${finalOrgG} | Total Score: ${finalOrgScore}`);
  } catch (error) {
    console.error(`[ESG Score Error] Failed to calculate scores: ${error.message}`);
  }
};

module.exports = {
  recalculateESGScores
};
