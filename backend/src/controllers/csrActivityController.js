const CSRActivity = require('../models/CSRActivity');
const EmployeeParticipation = require('../models/EmployeeParticipation');
const { getSettings } = require('../services/settingsService');
const { adjustUserPoints } = require('../services/xpService');
const { createNotification } = require('../services/notificationService');
const { recalculateESGScores } = require('../services/scoreService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all CSR activities
// @route   GET /api/csr-activities
// @access  Private
const getCSRActivities = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['title', 'location']);

    const activities = await CSRActivity.find(filter)
      .populate('category', 'name type')
      .populate('department', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await CSRActivity.countDocuments(filter);

    // Map each activity to include its actual participant count
    const activitiesWithCounts = await Promise.all(
      activities.map(async (act) => {
        const count = await EmployeeParticipation.countDocuments({
          csrActivity: act._id,
          approvalStatus: { $in: ['Approved', 'Pending'] } // count actual enrolled
        });
        return {
          ...act.toObject(),
          participantCount: count
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        activities: activitiesWithCounts,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[CSR Activities Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving CSR activities'
    });
  }
};

// @desc    Get single CSR activity
// @route   GET /api/csr-activities/:id
// @access  Private
const getCSRActivityById = async (req, res) => {
  try {
    const activity = await CSRActivity.findById(req.params.id)
      .populate('category', 'name type')
      .populate('department', 'name code')
      .populate('createdBy', 'name email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'CSR Activity not found'
      });
    }

    const count = await EmployeeParticipation.countDocuments({
      csrActivity: activity._id,
      approvalStatus: { $in: ['Approved', 'Pending'] }
    });

    const isJoined = await EmployeeParticipation.findOne({
      csrActivity: activity._id,
      employee: req.user._id
    });

    return res.status(200).json({
      success: true,
      data: {
        ...activity.toObject(),
        participantCount: count,
        userParticipation: isJoined
      }
    });
  } catch (error) {
    console.error(`[CSR GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving CSR activity details'
    });
  }
};

// @desc    Create CSR activity
// @route   POST /api/csr-activities
// @access  Private (Admin or ESG Manager Only)
const createCSRActivity = async (req, res) => {
  try {
    const { title, category, description, department, location, startDate, endDate, maxParticipants, pointsAwarded, evidenceRequired, status } = req.body;

    const activity = await CSRActivity.create({
      title,
      category,
      description,
      department,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxParticipants: Number(maxParticipants),
      pointsAwarded: Number(pointsAwarded) || 0,
      evidenceRequired: evidenceRequired !== undefined ? evidenceRequired : true,
      status: status || 'Draft',
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'CSR activity created successfully',
      data: activity
    });
  } catch (error) {
    console.error(`[CSR Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating CSR activity'
    });
  }
};

// @desc    Update CSR activity
// @route   PUT /api/csr-activities/:id
// @access  Private (Admin or ESG Manager Only)
const updateCSRActivity = async (req, res) => {
  try {
    const { title, category, description, department, location, startDate, endDate, maxParticipants, pointsAwarded, evidenceRequired, status } = req.body;
    const activity = await CSRActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'CSR Activity not found'
      });
    }

    if (title !== undefined) activity.title = title;
    if (category !== undefined) activity.category = category;
    if (description !== undefined) activity.description = description;
    if (department !== undefined) activity.department = department;
    if (location !== undefined) activity.location = location;
    if (startDate !== undefined) activity.startDate = new Date(startDate);
    if (endDate !== undefined) activity.endDate = new Date(endDate);
    if (maxParticipants !== undefined) activity.maxParticipants = Number(maxParticipants);
    if (pointsAwarded !== undefined) activity.pointsAwarded = Number(pointsAwarded);
    if (evidenceRequired !== undefined) activity.evidenceRequired = evidenceRequired;
    if (status !== undefined) activity.status = status;

    await activity.save();

    return res.status(200).json({
      success: true,
      message: 'CSR activity updated successfully',
      data: activity
    });
  } catch (error) {
    console.error(`[CSR Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating CSR activity'
    });
  }
};

// @desc    Delete CSR activity
// @route   DELETE /api/csr-activities/:id
// @access  Private (Admin or ESG Manager Only)
const deleteCSRActivity = async (req, res) => {
  try {
    const activity = await CSRActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'CSR Activity not found'
      });
    }

    // Do not delete completed or active activities with participations
    const hasEnrollments = await EmployeeParticipation.exists({ csrActivity: req.params.id });
    if (hasEnrollments) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete CSR activity: Employee participation records exist'
      });
    }

    await CSRActivity.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'CSR activity deleted successfully'
    });
  } catch (error) {
    console.error(`[CSR Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting CSR activity'
    });
  }
};

// @desc    Join a CSR activity
// @route   POST /api/csr-activities/:id/join
// @access  Private (Employee Only)
const joinCSRActivity = async (req, res) => {
  try {
    const activity = await CSRActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'CSR Activity not found'
      });
    }

    // Verify activity is joinable
    if (activity.status !== 'Active' && activity.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'CSR Activity is not open for joining'
      });
    }

    // Enforce deadline
    if (new Date() > new Date(activity.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'This CSR Activity has already concluded'
      });
    }

    // Verify capacity
    const enrolled = await EmployeeParticipation.countDocuments({
      csrActivity: activity._id,
      approvalStatus: { $in: ['Approved', 'Pending'] }
    });

    if (enrolled >= activity.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Registration full: Maximum participation capacity reached'
      });
    }

    // Prevent duplicate joining
    const duplicate = await EmployeeParticipation.findOne({
      csrActivity: activity._id,
      employee: req.user._id
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this CSR activity'
      });
    }

    const participation = await EmployeeParticipation.create({
      employee: req.user._id,
      csrActivity: activity._id,
      approvalStatus: 'Pending',
      pointsEarned: 0
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for CSR activity',
      data: participation
    });
  } catch (error) {
    console.error(`[CSR Join Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error registering for CSR activity'
    });
  }
};

// @desc    Submit participation proof / upload evidence
// @route   POST /api/csr-activities/:id/submit-proof
// @access  Private (Employee Only)
const submitCSRProof = async (req, res) => {
  try {
    const activity = await CSRActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'CSR Activity not found'
      });
    }

    const participation = await EmployeeParticipation.findOne({
      csrActivity: req.params.id,
      employee: req.user._id
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'CSR Participation record not found. You must join the activity first.'
      });
    }

    // Only require file if evidenceRequired is true AND no file provided
    if (activity.evidenceRequired && !req.file && !participation.proofFile) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a proof file document (PDF, PNG, JPG)'
      });
    }

    // Save proof metadata
    if (req.file) {
      participation.proofFile = `/uploads/${req.file.filename}`;
    }
    participation.notes = req.body.notes || req.body.evidenceNotes || '';
    participation.approvalStatus = 'Pending'; // submit for review
    await participation.save();

    return res.status(200).json({
      success: true,
      message: 'CSR activity completion submitted for manager review.',
      data: participation
    });
  } catch (error) {
    console.error(`[CSR Proof Upload Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during proof upload'
    });
  }
};

// @desc    Get all CSR participations for review/management
// @route   GET /api/csr-activities/participations/all
// @access  Private (Admin or ESG Manager Only)
const getParticipations = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query);

    const participations = await EmployeeParticipation.find(filter)
      .populate('employee', 'name email department')
      .populate('csrActivity', 'title pointsAwarded')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await EmployeeParticipation.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        participations,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[CSR Partic Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error loading participation logs'
    });
  }
};

// @desc    Get personal employee participation history
// @route   GET /api/csr-activities/participations/me
// @access  Private (Employee Only)
const getMyParticipations = async (req, res) => {
  try {
    const history = await EmployeeParticipation.find({ employee: req.user._id })
      .populate('csrActivity')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error(`[CSR Me Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching participation history'
    });
  }
};

// @desc    Review participation approval flow
// @route   POST /api/csr-activities/participations/:id/review
// @access  Private (Admin or ESG Manager Only)
const reviewCSRParticipation = async (req, res) => {
  try {
    const { approvalStatus, reviewNotes } = req.body;
    const participation = await EmployeeParticipation.findById(req.params.id)
      .populate('csrActivity')
      .populate('employee', 'name email');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Participation record not found'
      });
    }

    if (participation.approvalStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This participation record has already been reviewed'
      });
    }

    const settings = await getSettings();

    // 1. Evidence Check
    if (approvalStatus === 'Approved' && settings.csrEvidenceRequired && !participation.proofFile) {
      return res.status(400).json({
        success: false,
        message: 'Evidence required: CSR participation cannot be approved without a proof attachment file'
      });
    }

    // 2. Reject constraints: require reviewNotes
    if (approvalStatus === 'Rejected' && (!reviewNotes || reviewNotes.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Review notes are mandatory when rejecting participation'
      });
    }

    // 3. Save updates
    participation.approvalStatus = approvalStatus;
    participation.reviewNotes = reviewNotes || '';
    participation.reviewedBy = req.user._id;
    participation.completionDate = approvalStatus === 'Approved' ? new Date() : null;

    if (approvalStatus === 'Approved') {
      participation.pointsEarned = participation.csrActivity.pointsAwarded || 0;
    } else {
      participation.pointsEarned = 0;
    }

    await participation.save();

    // 4. Award points to Employee atomically if approved
    if (approvalStatus === 'Approved' && participation.pointsEarned > 0) {
      await adjustUserPoints(
        participation.employee._id,
        participation.pointsEarned,
        'CSR',
        `Completed CSR Activity: ${participation.csrActivity.title}`,
        participation._id
      );
    }

    // 5. Send alerts
    await createNotification({
      userId: participation.employee._id,
      title: approvalStatus === 'Approved' ? 'CSR Approved!' : 'CSR Rejected',
      message: approvalStatus === 'Approved'
        ? `Your participation in "${participation.csrActivity.title}" has been approved! Earned ${participation.pointsEarned} CSR points.`
        : `Your participation in "${participation.csrActivity.title}" was rejected. Notes: ${reviewNotes}`,
      type: 'CSR',
      relatedEntityType: 'CSRActivity',
      relatedEntityId: participation.csrActivity._id
    });

    // 6. Recalculate ESG Scores
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] CSR review trigger: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: `Participation status updated to: ${approvalStatus}`,
      data: participation
    });
  } catch (error) {
    console.error(`[CSR Review Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating participation review status'
    });
  }
};

module.exports = {
  getCSRActivities,
  getCSRActivityById,
  createCSRActivity,
  updateCSRActivity,
  deleteCSRActivity,
  joinCSRActivity,
  submitCSRProof,
  getParticipations,
  getMyParticipations,
  reviewCSRParticipation
};
