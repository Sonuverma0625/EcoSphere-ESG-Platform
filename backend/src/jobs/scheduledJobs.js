const cron = require('node-cron');
const ComplianceIssue = require('../models/ComplianceIssue');
const ESGPolicy = require('../models/ESGPolicy');
const Audit = require('../models/Audit');
const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { recalculateESGScores } = require('../services/scoreService');

/**
 * Mark overdue compliance issues and notify owners — runs daily at midnight
 */
const overdueComplianceJob = cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running overdue compliance check...');
  try {
    const now = new Date();

    // Find all open/in-progress issues past their due date
    const overdueIssues = await ComplianceIssue.find({
      status: { $in: ['Open', 'In Progress'] },
      dueDate: { $lt: now }
    }).populate('owner', 'name email');

    for (const issue of overdueIssues) {
      if (!issue.owner) continue;

      await createNotification({
        userId: issue.owner._id,
        title: 'Compliance Issue Overdue!',
        message: `Compliance issue "${issue.title}" (Severity: ${issue.severity}) is overdue. Due date was ${issue.dueDate.toLocaleDateString()}. Please take immediate action.`,
        type: 'Compliance',
        relatedEntityType: 'ComplianceIssue',
        relatedEntityId: issue._id
      });
    }

    console.log(`[CRON] Overdue compliance check complete. ${overdueIssues.length} overdue issues found.`);
  } catch (error) {
    console.error(`[CRON] Compliance overdue check failed: ${error.message}`);
  }
}, { scheduled: false });

/**
 * Send policy acknowledgement reminders — runs daily at 9am
 */
const policyReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running policy acknowledgement reminders...');
  try {
    const publishedPolicies = await ESGPolicy.find({
      status: 'Published',
      requiredAcknowledgement: true
    });

    const employees = await User.find({ role: 'Employee', status: 'Active' });

    for (const policy of publishedPolicies) {
      for (const employee of employees) {
        // Skip if employee is not in target department (if policy is targeted)
        if (policy.targetDepartments && policy.targetDepartments.length > 0) {
          if (!employee.department || !policy.targetDepartments.some(d => d.toString() === employee.department?.toString())) {
            continue;
          }
        }

        // Check if already acknowledged
        const hasAck = await PolicyAcknowledgement.findOne({
          policy: policy._id,
          employee: employee._id
        });

        if (!hasAck) {
          await createNotification({
            userId: employee._id,
            title: 'Policy Acknowledgement Required',
            message: `Please acknowledge the policy "${policy.title}" (Version ${policy.version}). Your acknowledgement is required.`,
            type: 'Policy',
            relatedEntityType: 'ESGPolicy',
            relatedEntityId: policy._id
          });
        }
      }
    }

    console.log('[CRON] Policy reminder job complete.');
  } catch (error) {
    console.error(`[CRON] Policy reminder job failed: ${error.message}`);
  }
}, { scheduled: false });

/**
 * Send audit deadline alerts — runs daily at 8am
 */
const auditDeadlineJob = cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Running audit deadline alert check...');
  try {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Audits due in the next 3 days that are not completed
    const upcomingAudits = await Audit.find({
      status: { $in: ['Scheduled', 'In Progress'] },
      dueDate: { $gte: now, $lte: in3Days }
    }).populate('assignedAuditor');

    for (const audit of upcomingAudits) {
      if (!audit.assignedAuditor) continue;

      await createNotification({
        userId: audit.assignedAuditor._id,
        title: 'Audit Deadline Approaching',
        message: `The audit "${audit.auditTitle}" is due on ${audit.dueDate.toLocaleDateString()}. Please complete the audit findings as soon as possible.`,
        type: 'Audit',
        relatedEntityType: 'Audit',
        relatedEntityId: audit._id
      });
    }

    console.log(`[CRON] Audit deadline alert check complete. ${upcomingAudits.length} upcoming audits notified.`);
  } catch (error) {
    console.error(`[CRON] Audit deadline job failed: ${error.message}`);
  }
}, { scheduled: false });

/**
 * Check sustainability goal deadlines — runs daily at 7am
 */
const goalDeadlineJob = cron.schedule('0 7 * * *', async () => {
  console.log('[CRON] Running sustainability goal deadline check...');
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Goals expiring in 7 days that are not completed
    const nearingGoals = await EnvironmentalGoal.find({
      status: { $in: ['Not Started', 'In Progress'] },
      endDate: { $gte: now, $lte: in7Days }
    }).populate('department', 'name code');

    // Notify ESG Managers about upcoming goal deadlines
    const esgManagers = await User.find({ role: 'ESG Manager', status: 'Active' });

    for (const goal of nearingGoals) {
      for (const manager of esgManagers) {
        await createNotification({
          userId: manager._id,
          title: 'Goal Deadline Approaching',
          message: `Environmental goal "${goal.title}" for department "${goal.department?.name || 'N/A'}" is due on ${goal.endDate.toLocaleDateString()}. Current progress: ${goal.progressPercentage}%`,
          type: 'Goal',
          relatedEntityType: 'EnvironmentalGoal',
          relatedEntityId: goal._id
        });
      }
    }

    console.log(`[CRON] Goal deadline check complete. ${nearingGoals.length} goals nearing deadline.`);
  } catch (error) {
    console.error(`[CRON] Goal deadline job failed: ${error.message}`);
  }
}, { scheduled: false });

/**
 * Recalculate ESG scores — runs every day at 2am
 */
const esgScoreRecalcJob = cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running scheduled ESG score recalculation...');
  try {
    await recalculateESGScores();
    console.log('[CRON] ESG score recalculation complete.');
  } catch (error) {
    console.error(`[CRON] ESG score recalculation failed: ${error.message}`);
  }
}, { scheduled: false });

/**
 * Start all scheduled jobs
 */
const startJobs = () => {
  overdueComplianceJob.start();
  policyReminderJob.start();
  auditDeadlineJob.start();
  goalDeadlineJob.start();
  esgScoreRecalcJob.start();
  console.log('[CRON] All scheduled jobs started.');
};

module.exports = {
  startJobs
};
