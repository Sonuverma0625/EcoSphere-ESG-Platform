const ESGPolicy = require('../models/ESGPolicy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const User = require('../models/User');
const { recalculateESGScores } = require('../services/scoreService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all policies
// @route   GET /api/policies
// @access  Private
const getPolicies = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['title', 'policyCode']);

    const policies = await ESGPolicy.find(filter)
      .populate('targetDepartments', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ESGPolicy.countDocuments(filter);

    // Calculate acknowledgement rates for each policy
    const activeEmployeesCount = await User.countDocuments({ role: 'Employee', status: 'Active' });
    const policiesWithAcks = await Promise.all(
      policies.map(async (policy) => {
        // If targeted, denominator is employees in those departments
        let denominator = activeEmployeesCount;
        if (policy.targetDepartments && policy.targetDepartments.length > 0) {
          denominator = await User.countDocuments({
            role: 'Employee',
            status: 'Active',
            department: { $in: policy.targetDepartments.map(d => d._id) }
          });
        }
        
        denominator = denominator || 1; // prevent divide by zero
        
        const acksCount = await PolicyAcknowledgement.countDocuments({ policy: policy._id });
        const ackRate = Math.round((acksCount / denominator) * 100);

        return {
          ...policy.toObject(),
          acknowledgementCount: acksCount,
          acknowledgementRate: Math.min(100, ackRate)
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        policies: policiesWithAcks,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Policy Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving policies'
    });
  }
};

// @desc    Get single policy details
// @route   GET /api/policies/:id
// @access  Private
const getPolicyById = async (req, res) => {
  try {
    const policy = await ESGPolicy.findById(req.params.id).populate('targetDepartments', 'name code');
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const hasAck = await PolicyAcknowledgement.findOne({
      policy: policy._id,
      employee: req.user._id
    });

    return res.status(200).json({
      success: true,
      data: {
        ...policy.toObject(),
        acknowledged: !!hasAck,
        acknowledgedAt: hasAck ? hasAck.acknowledgedAt : null
      }
    });
  } catch (error) {
    console.error(`[Policy GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving policy details'
    });
  }
};

// @desc    Create policy (Admin/ESG Manager)
// @route   POST /api/policies
// @access  Private (Admin or ESG Manager Only)
const createPolicy = async (req, res) => {
  try {
    const { title, policyCode, description, version, effectiveDate, reviewDate, requiredAcknowledgement, targetDepartments, status } = req.body;

    const code = policyCode.trim().toUpperCase();

    // Prevent duplicate codes
    const codeConflict = await ESGPolicy.findOne({ policyCode: code });
    if (codeConflict) {
      return res.status(400).json({
        success: false,
        message: `A policy with code "${code}" already exists`
      });
    }

    // Capture file attachment if uploaded
    let documentPath = '';
    if (req.file) {
      documentPath = `/uploads/${req.file.filename}`;
    }

    // targetDepartments is sent as stringified JSON from FormData sometimes
    let targetDepts = [];
    if (targetDepartments) {
      try {
        targetDepts = typeof targetDepartments === 'string' ? JSON.parse(targetDepartments) : targetDepartments;
      } catch (e) {
        targetDepts = targetDepartments;
      }
    }

    const policy = await ESGPolicy.create({
      title,
      policyCode: code,
      description,
      version: version || '1.0',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
      documentAttachment: documentPath,
      requiredAcknowledgement: requiredAcknowledgement !== undefined ? requiredAcknowledgement === 'true' || requiredAcknowledgement === true : true,
      targetDepartments: targetDepts,
      status: status || 'Draft'
    });

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error(`[Policy Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating policy'
    });
  }
};

// @desc    Update policy
// @route   PUT /api/policies/:id
// @access  Private (Admin or ESG Manager Only)
const updatePolicy = async (req, res) => {
  try {
    const { title, policyCode, description, version, effectiveDate, reviewDate, requiredAcknowledgement, targetDepartments, status } = req.body;
    const policy = await ESGPolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    if (policyCode) {
      const code = policyCode.trim().toUpperCase();
      if (code !== policy.policyCode) {
        const conflict = await ESGPolicy.findOne({ policyCode: code });
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `A policy with code "${code}" already exists`
          });
        }
        policy.policyCode = code;
      }
    }

    if (title !== undefined) policy.title = title;
    if (description !== undefined) policy.description = description;
    if (version !== undefined) policy.version = version;
    if (effectiveDate !== undefined) policy.effectiveDate = new Date(effectiveDate);
    if (reviewDate !== undefined) policy.reviewDate = new Date(reviewDate);
    if (requiredAcknowledgement !== undefined) {
      policy.requiredAcknowledgement = requiredAcknowledgement === 'true' || requiredAcknowledgement === true;
    }

    if (targetDepartments !== undefined) {
      try {
        policy.targetDepartments = typeof targetDepartments === 'string' ? JSON.parse(targetDepartments) : targetDepartments;
      } catch (e) {
        policy.targetDepartments = targetDepartments;
      }
    }

    if (status !== undefined) policy.status = status;

    if (req.file) {
      policy.documentAttachment = `/uploads/${req.file.filename}`;
    }

    await policy.save();

    // Recalculate scores if policies published/modified
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Policy updated: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: policy
    });
  } catch (error) {
    console.error(`[Policy Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating policy'
    });
  }
};

// @desc    Delete policy
// @route   DELETE /api/policies/:id
// @access  Private (Admin or ESG Manager Only)
const deletePolicy = async (req, res) => {
  try {
    const policy = await ESGPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Safeguard check
    const hasAcks = await PolicyAcknowledgement.exists({ policy: req.params.id });
    if (hasAcks) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete policy: Active employee acknowledgements exist'
      });
    }

    await ESGPolicy.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error(`[Policy Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting policy'
    });
  }
};

// @desc    Acknowledge a policy
// @route   POST /api/policies/:id/acknowledge
// @access  Private (Employee Only)
const acknowledgePolicy = async (req, res) => {
  try {
    const policy = await ESGPolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    if (policy.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'This policy is not open for acknowledgement'
      });
    }

    // Check duplicate
    const duplicate = await PolicyAcknowledgement.findOne({
      policy: policy._id,
      employee: req.user._id
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You have already acknowledged this policy'
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const ack = await PolicyAcknowledgement.create({
      policy: policy._id,
      employee: req.user._id,
      acknowledgedAt: new Date(),
      ipAddress,
      status: 'Acknowledged'
    });

    // Score update
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Policy acknowledged: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Policy acknowledged successfully',
      data: ack
    });
  } catch (error) {
    console.error(`[Policy Ack Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during policy acknowledgement'
    });
  }
};

// @desc    Get all policy acknowledgements (For Reports & Admins)
// @route   GET /api/policies/acknowledgements/all
// @access  Private
const getAcknowledgementsList = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query);

    const acks = await PolicyAcknowledgement.find(filter)
      .populate('policy', 'title policyCode version')
      .populate('employee', 'name email department')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await PolicyAcknowledgement.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        acknowledgements: acks,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Acks List Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading acknowledgement logs'
    });
  }
};

// @desc    Get current employee's policy acknowledgements
// @route   GET /api/policies/acknowledgements/me
// @access  Private (Employee Only)
const getMyAcknowledgements = async (req, res) => {
  try {
    const acks = await PolicyAcknowledgement.find({ employee: req.user._id })
      .populate('policy')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: acks
    });
  } catch (error) {
    console.error(`[My Acks Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading personal policy acknowledgements'
    });
  }
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
  getAcknowledgementsList,
  getMyAcknowledgements
};
