const Audit = require('../models/Audit');
const { parseQueryParams } = require('../utils/apiFeatures');
const { recalculateESGScores } = require('../services/scoreService');
const { createNotification } = require('../services/notificationService');

// @desc    Get all audits (Auditor filtered by assignment)
// @route   GET /api/audits
// @access  Private
const getAudits = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['auditTitle', 'auditType']);

    // If logged-in user is an Auditor, restrict to their assigned audits
    if (req.user.role === 'Auditor') {
      filter.assignedAuditor = req.user._id;
    }

    const audits = await Audit.find(filter)
      .populate('department', 'name code')
      .populate('assignedAuditor', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Audit.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        audits,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Audit Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving audits'
    });
  }
};

// @desc    Get single audit
// @route   GET /api/audits/:id
// @access  Private
const getAuditById = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('department', 'name code')
      .populate('assignedAuditor', 'name email')
      .populate('createdBy', 'name email');

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Security: Auditor must be the assigned auditor
    if (req.user.role === 'Auditor' && audit.assignedAuditor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to access this audit'
      });
    }

    return res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error(`[Audit GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching audit details'
    });
  }
};

// @desc    Create audit
// @route   POST /api/audits
// @access  Private (Admin or ESG Manager Only)
const createAudit = async (req, res) => {
  try {
    const { auditTitle, auditType, department, assignedAuditor, startDate, dueDate, status, scope } = req.body;

    const audit = await Audit.create({
      auditTitle,
      auditType,
      department,
      assignedAuditor,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      status: status || 'Draft',
      scope,
      createdBy: req.user._id
    });

    // Notify assigned auditor
    await createNotification({
      userId: assignedAuditor,
      title: 'New Audit Assigned',
      message: `You have been assigned to conduct the audit: "${auditTitle}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'Audit',
      relatedEntityType: 'Audit',
      relatedEntityId: audit._id
    });

    return res.status(201).json({
      success: true,
      message: 'Audit created and scheduled successfully',
      data: audit
    });
  } catch (error) {
    console.error(`[Audit Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating audit'
    });
  }
};

// @desc    Update audit details (Admin or ESG Manager Only)
// @route   PUT /api/audits/:id
// @access  Private (Admin or ESG Manager Only)
const updateAudit = async (req, res) => {
  try {
    const { auditTitle, auditType, department, assignedAuditor, startDate, dueDate, status, scope, findings, score } = req.body;
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    if (auditTitle !== undefined) audit.auditTitle = auditTitle;
    if (auditType !== undefined) audit.auditType = auditType;
    if (department !== undefined) audit.department = department;
    if (scope !== undefined) audit.scope = scope;
    if (findings !== undefined) audit.findings = findings;
    if (score !== undefined) audit.score = Number(score);
    if (startDate !== undefined) audit.startDate = new Date(startDate);
    if (dueDate !== undefined) audit.dueDate = new Date(dueDate);

    // Track if status shifts to Completed
    const previousStatus = audit.status;
    if (status !== undefined) audit.status = status;

    if (assignedAuditor !== undefined && assignedAuditor !== audit.assignedAuditor.toString()) {
      audit.assignedAuditor = assignedAuditor;
      // Notify new auditor
      await createNotification({
        userId: assignedAuditor,
        title: 'New Audit Assigned',
        message: `You have been assigned to conduct the audit: "${audit.auditTitle}".`,
        type: 'Audit',
        relatedEntityType: 'Audit',
        relatedEntityId: audit._id
      });
    }

    await audit.save();

    if (audit.status === 'Completed' && previousStatus !== 'Completed') {
      recalculateESGScores().catch(err => {
        console.error(`[Score Recalc Error] Audit Completed trigger: ${err.message}`);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Audit updated successfully',
      data: audit
    });
  } catch (error) {
    console.error(`[Audit Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating audit details'
    });
  }
};

// @desc    Record findings and audit scores (Assigned Auditor Only)
// @route   POST /api/audits/:id/findings
// @access  Private (Auditor or Admin/Manager Only)
const recordFindings = async (req, res) => {
  try {
    const { findings, score, status } = req.body;
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Verify ownership
    if (req.user.role === 'Auditor' && audit.assignedAuditor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update findings for this audit'
      });
    }

    audit.findings = findings || '';
    audit.score = score !== undefined ? Number(score) : audit.score;
    
    // Status can be In Progress or Completed
    if (status) {
      audit.status = status;
    } else {
      audit.status = 'In Progress';
    }

    await audit.save();

    if (audit.status === 'Completed') {
      recalculateESGScores().catch(err => {
        console.error(`[Score Recalc Error] Auditor completion: ${err.message}`);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Audit findings and scores updated successfully',
      data: audit
    });
  } catch (error) {
    console.error(`[Audit Findings Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error recording audit findings'
    });
  }
};

// @desc    Delete audit
// @route   DELETE /api/audits/:id
// @access  Private (Admin or ESG Manager Only)
const deleteAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found'
      });
    }

    // Do not delete completed audits
    if (audit.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an audit that has already been completed'
      });
    }

    await Audit.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Audit deleted successfully'
    });
  } catch (error) {
    console.error(`[Audit Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting audit'
    });
  }
};

module.exports = {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  recordFindings,
  deleteAudit
};
