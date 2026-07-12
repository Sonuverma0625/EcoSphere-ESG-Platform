const ComplianceIssue = require('../models/ComplianceIssue');
const { parseQueryParams } = require('../utils/apiFeatures');
const { createNotification } = require('../services/notificationService');
const { recalculateESGScores } = require('../services/scoreService');

// @desc    Get all compliance issues
// @route   GET /api/compliance-issues
// @access  Private
const getComplianceIssues = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['title', 'description']);

    // If logged-in user is an Employee, only show issues owned by them
    if (req.user.role === 'Employee') {
      filter.owner = req.user._id;
    }

    const issues = await ComplianceIssue.find(filter)
      .populate('auditReference', 'auditTitle')
      .populate('department', 'name code')
      .populate('owner', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ComplianceIssue.countDocuments(filter);

    // Map each issue to mark as overdue on-the-fly
    const mappedIssues = issues.map(issue => {
      const isOverdue = (issue.status === 'Open' || issue.status === 'In Progress') && new Date(issue.dueDate) < new Date();
      return {
        ...issue.toObject(),
        isOverdue
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        issues: mappedIssues,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Compliance Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving compliance issues'
    });
  }
};

// @desc    Get single compliance issue
// @route   GET /api/compliance-issues/:id
// @access  Private
const getComplianceIssueById = async (req, res) => {
  try {
    const issue = await ComplianceIssue.findById(req.params.id)
      .populate('auditReference', 'auditTitle')
      .populate('department', 'name code')
      .populate('owner', 'name email')
      .populate('createdBy', 'name email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Compliance issue not found'
      });
    }

    // Security: Employee can only read owned issues
    if (req.user.role === 'Employee' && issue.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this compliance issue'
      });
    }

    const isOverdue = (issue.status === 'Open' || issue.status === 'In Progress') && new Date(issue.dueDate) < new Date();

    return res.status(200).json({
      success: true,
      data: {
        ...issue.toObject(),
        isOverdue
      }
    });
  } catch (error) {
    console.error(`[Compliance GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching compliance issue details'
    });
  }
};

// @desc    Create compliance issue
// @route   POST /api/compliance-issues
// @access  Private (Admin, ESG Manager, or Auditor Only)
const createComplianceIssue = async (req, res) => {
  try {
    const { auditReference, title, severity, description, department, owner, dueDate } = req.body;

    const issue = await ComplianceIssue.create({
      auditReference: auditReference || null,
      title,
      severity: severity || 'Medium',
      description,
      department,
      owner, // Mandatory
      dueDate: new Date(dueDate), // Mandatory
      status: 'Open',
      createdBy: req.user._id
    });

    // Notify Owner
    await createNotification({
      userId: owner,
      title: 'New Compliance Issue Assigned',
      message: `A new compliance issue: "${title}" (Severity: ${severity || 'Medium'}) has been assigned to you. Due date: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'Compliance',
      relatedEntityType: 'ComplianceIssue',
      relatedEntityId: issue._id
    });

    // Trigger score update
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Compliance issue created: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Compliance issue created and assigned successfully',
      data: issue
    });
  } catch (error) {
    console.error(`[Compliance Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating compliance issue'
    });
  }
};

// @desc    Update compliance issue (Admin or ESG Manager Only)
// @route   PUT /api/compliance-issues/:id
// @access  Private (Admin or ESG Manager Only)
const updateComplianceIssue = async (req, res) => {
  try {
    const { title, severity, description, department, owner, dueDate, status } = req.body;
    const issue = await ComplianceIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Compliance issue not found'
      });
    }

    if (title !== undefined) issue.title = title;
    if (severity !== undefined) issue.severity = severity;
    if (description !== undefined) issue.description = description;
    if (department !== undefined) issue.department = department;
    if (dueDate !== undefined) issue.dueDate = new Date(dueDate);

    // Only allow Admin/ESG Manager to update owners
    if (owner !== undefined && owner !== issue.owner.toString()) {
      issue.owner = owner;
      // Notify new owner
      await createNotification({
        userId: owner,
        title: 'Compliance Issue Transferred',
        message: `Compliance issue "${issue.title}" has been assigned to you.`,
        type: 'Compliance',
        relatedEntityType: 'ComplianceIssue',
        relatedEntityId: issue._id
      });
    }

    // Admin/ESG Manager can set status directly (e.g. In Progress, Open, Closed)
    if (status !== undefined) {
      if (status === 'Closed' && issue.status !== 'Resolved' && req.user.role !== 'Admin' && req.user.role !== 'ESG Manager') {
        return res.status(400).json({
          success: false,
          message: 'Compliance issues can only be Closed by authorized Admin or ESG Manager users'
        });
      }
      issue.status = status;
    }

    await issue.save();

    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Compliance issue updated: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Compliance issue updated successfully',
      data: issue
    });
  } catch (error) {
    console.error(`[Compliance Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating compliance issue details'
    });
  }
};

// @desc    Resolve compliance issue
// @route   POST /api/compliance-issues/:id/resolve
// @access  Private (Owner, Auditor, or Admin/Manager)
const resolveComplianceIssue = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const issue = await ComplianceIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Compliance issue not found'
      });
    }

    // Verify ownership
    const isOwner = issue.owner.toString() === req.user._id.toString();
    const isAuthorized = ['Admin', 'ESG Manager', 'Auditor'].includes(req.user.role);
    if (!isOwner && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to resolve this compliance issue'
      });
    }

    // Resolution notes are mandatory
    if (!resolutionNotes || resolutionNotes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes are mandatory when resolving compliance issues'
      });
    }

    issue.status = 'Resolved';
    issue.resolutionNotes = resolutionNotes;
    issue.resolvedAt = new Date();
    await issue.save();

    // Notify creator / managers
    await createNotification({
      userId: issue.createdBy,
      title: 'Compliance Issue Resolved',
      message: `Compliance issue "${issue.title}" has been resolved by the owner. Notes: ${resolutionNotes}`,
      type: 'Compliance',
      relatedEntityType: 'ComplianceIssue',
      relatedEntityId: issue._id
    });

    // Score recalculation
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Compliance issue resolved: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Compliance issue marked as resolved successfully',
      data: issue
    });
  } catch (error) {
    console.error(`[Compliance Resolve Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error resolving compliance issue'
    });
  }
};

// @desc    Close compliance issue (Admin or ESG Manager Only)
// @route   POST /api/compliance-issues/:id/close
// @access  Private (Admin or ESG Manager Only)
const closeComplianceIssue = async (req, res) => {
  try {
    const issue = await ComplianceIssue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Compliance issue not found'
      });
    }

    issue.status = 'Closed';
    await issue.save();

    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Compliance issue closed: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Compliance issue closed successfully',
      data: issue
    });
  } catch (error) {
    console.error(`[Compliance Close Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error closing compliance issue'
    });
  }
};

module.exports = {
  getComplianceIssues,
  getComplianceIssueById,
  createComplianceIssue,
  updateComplianceIssue,
  resolveComplianceIssue,
  closeComplianceIssue
};
