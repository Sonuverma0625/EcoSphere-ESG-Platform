const User = require('../models/User');
const Department = require('../models/Department');
const CarbonTransaction = require('../models/CarbonTransaction');
const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const CSRActivity = require('../models/CSRActivity');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const ESGPolicy = require('../models/ESGPolicy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const Audit = require('../models/Audit');
const ComplianceIssue = require('../models/ComplianceIssue');
const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const Notification = require('../models/Notification');
const DepartmentScore = require('../models/DepartmentScore');
const ESGScoreHistory = require('../models/ESGScoreHistory');
const { getSettings } = require('../services/settingsService');

// Helper to compute YYYY-MM periods
const getPeriods = () => {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let prevMonth = now.getMonth() - 1;
  let prevYear = now.getFullYear();
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const previousPeriod = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
  
  return { currentPeriod, previousPeriod };
};

// @desc    Get Organization Main Dashboard
// @route   GET /api/dashboard/org
// @access  Private
const getOrgDashboard = async (req, res) => {
  try {
    const { currentPeriod } = getPeriods();

    // 1. Get latest ESG Score History
    let scores = await ESGScoreHistory.findOne({ period: currentPeriod });
    if (!scores) {
      // Return default scores or try to find the absolute latest
      scores = await ESGScoreHistory.findOne().sort({ period: -1 });
      if (!scores) {
        scores = { organizationScore: 70, environmentalScore: 70, socialScore: 70, governanceScore: 70 };
      }
    }

    // 2. Counts & KPI summaries
    const totalEmissionsResult = await CarbonTransaction.aggregate([
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);
    const totalEmissions = totalEmissionsResult.length > 0 ? Math.round(totalEmissionsResult[0].total) : 0;

    const activeCSRs = await CSRActivity.countDocuments({ status: 'Active' });
    const activeChallenges = await Challenge.countDocuments({ status: 'Active' });
    const openCompliance = await ComplianceIssue.countDocuments({ status: { $in: ['Open', 'In Progress'] } });
    
    // Pending approvals: CSR and Challenge submissions
    const pendingCSR = await EmployeeParticipation.countDocuments({ approvalStatus: 'Pending' });
    const pendingChallenge = await ChallengeParticipation.countDocuments({ approvalStatus: 'Pending' });
    const pendingApprovals = pendingCSR + pendingChallenge;

    const employeesEngaged = await User.countDocuments({ role: 'Employee', status: 'Active', xpLifetime: { $gt: 0 } });

    // 3. Trends & Charts
    // ESG trend (up to last 6 months)
    const esgTrend = await ESGScoreHistory.find().sort({ period: 1 }).limit(6);

    // Monthly emissions (up to last 6 months)
    const emissionsTrend = await CarbonTransaction.aggregate([
      {
        $group: {
          _id: { $substr: ['$transactionDate', 0, 7] },
          emissions: { $sum: '$calculatedEmission' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Department Ranking
    const deptRankings = await DepartmentScore.find({ period: currentPeriod })
      .populate('department', 'name code')
      .sort({ totalScore: -1 });

    // Compliance severity breakdown
    const severityBreakdown = await ComplianceIssue.aggregate([
      { $match: { status: { $in: ['Open', 'In Progress'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          overallScore: scores.organizationScore,
          environmentalScore: scores.environmentalScore,
          socialScore: scores.socialScore,
          governanceScore: scores.governanceScore,
          totalEmissions,
          activeCSRs,
          activeChallenges,
          openCompliance,
          pendingApprovals,
          employeesEngaged
        },
        charts: {
          esgTrend,
          emissionsTrend: emissionsTrend.map(e => ({ period: e._id, emissions: Math.round(e.emissions) })),
          deptRankings,
          severityBreakdown: severityBreakdown.map(s => ({ severity: s._id, count: s.count }))
        }
      }
    });
  } catch (error) {
    console.error(`[Org Dashboard Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading organization dashboard'
    });
  }
};

// @desc    Get Environmental Module Dashboard
// @route   GET /api/dashboard/environmental
// @access  Private
const getEnvironmentalDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Carbon KPI Cards
    const totalEmissionsResult = await CarbonTransaction.aggregate([
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);
    const totalEmissions = totalEmissionsResult.length > 0 ? Math.round(totalEmissionsResult[0].total) : 0;

    const currentMonthEmissionsRes = await CarbonTransaction.aggregate([
      { $match: { transactionDate: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);
    const currentMonthEmissions = currentMonthEmissionsRes.length > 0 ? Math.round(currentMonthEmissionsRes[0].total) : 0;

    const prevMonthEmissionsRes = await CarbonTransaction.aggregate([
      { $match: { transactionDate: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);
    const prevMonthEmissions = prevMonthEmissionsRes.length > 0 ? Math.round(prevMonthEmissionsRes[0].total) : 0;

    // Goals at risk or active
    const activeGoals = await EnvironmentalGoal.countDocuments({ status: { $in: ['Not Started', 'In Progress'] } });
    const atRiskGoals = await EnvironmentalGoal.countDocuments({ status: 'At Risk' });
    const allGoalsList = await EnvironmentalGoal.find().populate('department', 'name code');

    // 2. Department emission ranking
    const deptEmissions = await CarbonTransaction.aggregate([
      {
        $group: {
          _id: '$department',
          emissions: { $sum: '$calculatedEmission' }
        }
      },
      { $sort: { emissions: -1 } }
    ]);
    const deptEmissionsRanked = await Department.populate(deptEmissions, { path: '_id', select: 'name code' });

    // 3. Emissions by Activity Type
    const emissionsByActivity = await CarbonTransaction.aggregate([
      { $group: { _id: '$activityType', emissions: { $sum: '$calculatedEmission' } } },
      { $sort: { emissions: -1 } }
    ]);

    // Highest emission source
    const highestEmissionSource = emissionsByActivity.length > 0 ? emissionsByActivity[0]._id : 'None';

    // 4. Monthly trend
    const emissionsTrend = await CarbonTransaction.aggregate([
      {
        $group: {
          _id: { $substr: ['$transactionDate', 0, 7] },
          emissions: { $sum: '$calculatedEmission' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalEmissions,
          currentMonthEmissions,
          prevMonthEmissions,
          activeGoals,
          atRiskGoals,
          highestEmissionSource
        },
        charts: {
          deptEmissionsRank: deptEmissionsRanked.map(item => ({
            department: item._id ? item._id.name : 'Unknown',
            emissions: Math.round(item.emissions)
          })),
          activityBreakdown: emissionsByActivity.map(item => ({
            activityType: item._id,
            emissions: Math.round(item.emissions)
          })),
          monthlyTrend: emissionsTrend.map(e => ({ period: e._id, emissions: Math.round(e.emissions) })),
          goalsProgress: allGoalsList
        }
      }
    });
  } catch (error) {
    console.error(`[Env Dashboard Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading environmental dashboard'
    });
  }
};

// @desc    Get Social Module Dashboard
// @route   GET /api/dashboard/social
// @access  Private
const getSocialDashboard = async (req, res) => {
  try {
    const totalActiveEmployees = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const engagedEmployees = await User.countDocuments({ role: 'Employee', status: 'Active', xpLifetime: { $gt: 0 } });
    
    // CSR Hours (proxy points as completed CSR activity participations * default 2 hours per activity)
    const approvedCSRCount = await EmployeeParticipation.countDocuments({ approvalStatus: 'Approved' });
    const csrHours = approvedCSRCount * 2; // default scale factor

    // Diversity / Engagement stats
    // Participation rates by department
    const deptParticipation = await EmployeeParticipation.aggregate([
      { $match: { approvalStatus: 'Approved' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeObj'
        }
      },
      { $unwind: '$employeeObj' },
      {
        $group: {
          _id: '$employeeObj.department',
          count: { $sum: 1 }
        }
      }
    ]);
    const deptParticipationPopulated = await Department.populate(deptParticipation, { path: '_id', select: 'name code' });

    // Active challenges completed
    const completedChallengesCount = await ChallengeParticipation.countDocuments({ approvalStatus: 'Approved' });
    
    // Avg participation per employee
    const avgParticipation = totalActiveEmployees > 0 ? (approvedCSRCount / totalActiveEmployees).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalActiveEmployees,
          engagedEmployees,
          participationRate: totalActiveEmployees > 0 ? Math.round((engagedEmployees / totalActiveEmployees) * 100) : 0,
          csrHours,
          approvedCSRCount,
          avgParticipation
        },
        charts: {
          deptParticipation: deptParticipationPopulated.map(item => ({
            department: item._id ? item._id.name : 'General',
            participations: item.count
          })),
          completedChallengesCount
        }
      }
    });
  } catch (error) {
    console.error(`[Social Dashboard Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading social dashboard'
    });
  }
};

// @desc    Get Governance Module Dashboard
// @route   GET /api/dashboard/governance
// @access  Private
const getGovernanceDashboard = async (req, res) => {
  try {
    // Open issues
    const openIssues = await ComplianceIssue.countDocuments({ status: { $in: ['Open', 'In Progress'] } });
    const criticalIssues = await ComplianceIssue.countDocuments({ status: { $in: ['Open', 'In Progress'] }, severity: 'Critical' });
    
    // Overdue logic: Open or In Progress past their due date
    const overdueIssues = await ComplianceIssue.countDocuments({
      status: { $in: ['Open', 'In Progress'] },
      dueDate: { $lt: new Date() }
    });

    // Audits Completed vs total Scheduled/In Progress
    const completedAudits = await Audit.countDocuments({ status: 'Completed' });
    const scheduledAudits = await Audit.countDocuments({ status: { $in: ['Scheduled', 'In Progress'] } });
    const totalAudits = await Audit.countDocuments();
    const auditCompletionRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 100;

    // Policy Acknowledgement Rate
    const totalPublishedPolicies = await ESGPolicy.countDocuments({ status: 'Published' });
    const totalEmployees = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const totalAcks = await PolicyAcknowledgement.countDocuments();
    const targetAcks = totalPublishedPolicies * totalEmployees;
    const policyAckRate = targetAcks > 0 ? Math.round((totalAcks / targetAcks) * 100) : 100;

    // Issues by severity breakdown
    const severityBreakdown = await ComplianceIssue.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Issues by department breakdown
    const deptBreakdown = await ComplianceIssue.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const deptBreakdownPopulated = await Department.populate(deptBreakdown, { path: '_id', select: 'name code' });

    // Upcoming policy reviews & audit deadlines
    const upcomingAudits = await Audit.find({ status: { $in: ['Draft', 'Scheduled', 'In Progress'] } })
      .populate('department', 'name code')
      .populate('assignedAuditor', 'name email')
      .sort({ dueDate: 1 })
      .limit(5);

    const upcomingPolicies = await ESGPolicy.find({ status: 'Published' })
      .sort({ reviewDate: 1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          openIssues,
          overdueIssues,
          criticalIssues,
          auditCompletionRate,
          policyAckRate
        },
        charts: {
          severityBreakdown: severityBreakdown.map(s => ({ severity: s._id, count: s.count })),
          deptBreakdown: deptBreakdownPopulated.map(d => ({ department: d._id ? d._id.name : 'Unknown', count: d.count })),
          upcomingAudits,
          upcomingPolicies
        }
      }
    });
  } catch (error) {
    console.error(`[Gov Dashboard Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading governance dashboard'
    });
  }
};

// @desc    Get Personal Employee Dashboard
// @route   GET /api/dashboard/employee
// @access  Private
const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const user = await User.findById(employeeId);

    // 1. Calculate Rank (1-indexed based on lifetime XP DESC)
    const rankResult = await User.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$_id', xp: { $max: '$xpLifetime' } } },
      { $sort: { xp: -1 } }
    ]);
    
    let rank = 1;
    for (let i = 0; i < rankResult.length; i++) {
      if (rankResult[i]._id.toString() === employeeId.toString()) {
        rank = i + 1;
        break;
      }
    }

    // 2. Fetch badges
    const userBadges = await UserBadge.find({ user: employeeId }).populate('badge');
    const earnedBadges = userBadges.map(ub => ub.badge);

    // 3. Active challenge participations
    const joinedChallenges = await ChallengeParticipation.find({ employee: employeeId })
      .populate({
        path: 'challenge',
        populate: { path: 'category' }
      });

    // 4. Completed CSRs
    const completedCSRs = await EmployeeParticipation.find({ employee: employeeId, approvalStatus: 'Approved' })
      .populate({
        path: 'csrActivity',
        populate: { path: 'category' }
      });

    // 5. Pending targeted policies (published, not yet acknowledged)
    const acknowledgedPolicyIds = await PolicyAcknowledgement.find({ employee: employeeId }).distinct('policy');
    
    const pendingPolicies = await ESGPolicy.find({
      status: 'Published',
      _id: { $nin: acknowledgedPolicyIds },
      $or: [
        { targetDepartments: [] },
        { targetDepartments: user.department }
      ]
    });

    // 6. Available rewards (stock > 0 and Active status)
    const availableRewards = await Reward.find({ status: 'Active', availableStock: { $gt: 0 } }).limit(4);

    // 7. Recent notifications (last 5 unread)
    const recentNotifications = await Notification.find({ user: employeeId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          xpCurrent: user.xpCurrent,
          xpLifetime: user.xpLifetime,
          csrPoints: user.csrPoints,
          rank
        },
        earnedBadges,
        joinedChallenges,
        completedCSRs,
        pendingPolicies,
        availableRewards,
        recentNotifications
      }
    });
  } catch (error) {
    console.error(`[Employee Dashboard Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading employee dashboard statistics'
    });
  }
};

// @desc    Get unified Dashboard Summary (used by frontend Dashboard.jsx)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const { currentPeriod, previousPeriod } = getPeriods();
    const settings = await getSettings();

    // 1. Get latest ESG Score History
    let currentScores = await ESGScoreHistory.findOne({ period: currentPeriod });
    if (!currentScores) {
      currentScores = await ESGScoreHistory.findOne().sort({ period: -1 });
    }

    const envScore = currentScores?.environmentalScore || 70;
    const socScore = currentScores?.socialScore || 70;
    const govScore = currentScores?.governanceScore || 70;
    const orgScore = currentScores?.organizationScore || 70;

    // Compute ESG grade
    const grade = orgScore >= 90 ? 'A+' : orgScore >= 80 ? 'A' : orgScore >= 70 ? 'B' : orgScore >= 60 ? 'C' : 'D';

    // 2. Carbon Metrics (current vs prev month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentEmissRes = await CarbonTransaction.aggregate([
      { $match: { transactionDate: { $gte: startOfCurrentMonth } } },
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);
    const prevEmissRes = await CarbonTransaction.aggregate([
      { $match: { transactionDate: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
      { $group: { _id: null, total: { $sum: '$calculatedEmission' } } }
    ]);

    const currentCO2 = currentEmissRes[0]?.total || 0;
    const prevCO2 = prevEmissRes[0]?.total || 0;
    const percentageChange = prevCO2 > 0 ? Math.abs(((currentCO2 - prevCO2) / prevCO2) * 100).toFixed(1) : 0;
    const isReduction = currentCO2 <= prevCO2;

    // 3. Employee participation
    const totalActive = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const activeUsers = await User.countDocuments({ role: 'Employee', status: 'Active', xpLifetime: { $gt: 0 } });
    const participationRate = totalActive > 0 ? Math.round((activeUsers / totalActive) * 100) : 0;

    // 4. Governance Metrics
    const totalIssues = await ComplianceIssue.countDocuments();
    const resolvedCount = await ComplianceIssue.countDocuments({ status: 'Resolved' });
    const openCount = await ComplianceIssue.countDocuments({ status: { $in: ['Open', 'In Progress'] } });

    // 5. Score History (last 6 months)
    const scoreHistory = await ESGScoreHistory.find().sort({ period: 1 }).limit(6);

    // 6. Recent Activities (Audits + CSR combined)
    const recentAudits = await Audit.find()
      .sort({ updatedAt: -1 })
      .limit(4)
      .select('auditTitle status updatedAt');
    const recentCSR = await CSRActivity.find()
      .sort({ updatedAt: -1 })
      .limit(4)
      .select('title status updatedAt');

    const recentActivities = [
      ...recentAudits.map(a => ({ title: a.auditTitle, status: a.status, date: a.updatedAt, module: 'Audit' })),
      ...recentCSR.map(c => ({ title: c.title, status: c.status, date: c.updatedAt, module: 'CSR' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    // 7. Department Scores
    const departmentScores = await DepartmentScore.find({ period: currentPeriod })
      .populate('department', 'name code')
      .sort({ totalScore: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        esgIndex: { score: orgScore, grade },
        environmentalScore: envScore,
        socialScore: socScore,
        governanceScore: govScore,
        carbonMetrics: {
          totalCo2: Math.round(currentCO2),
          percentageChange: parseFloat(percentageChange),
          isReduction
        },
        employeeParticipation: {
          activeUsersCount: activeUsers,
          participationRate
        },
        governanceMetrics: {
          totalCount: totalIssues,
          resolvedCount,
          openCount
        },
        scoreHistory,
        recentActivities,
        departmentScores
      }
    });
  } catch (error) {
    console.error(`[Dashboard Summary Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading dashboard summary'
    });
  }
};

module.exports = {
  getOrgDashboard,
  getEnvironmentalDashboard,
  getSocialDashboard,
  getGovernanceDashboard,
  getEmployeeDashboard,
  getDashboardSummary
};
