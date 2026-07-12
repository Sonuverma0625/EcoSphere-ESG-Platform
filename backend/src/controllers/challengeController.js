const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const { adjustUserPoints } = require('../services/xpService');
const { createNotification } = require('../services/notificationService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private
const getChallenges = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['title', 'description']);

    const challenges = await Challenge.find(filter)
      .populate('category', 'name type')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Challenge.countDocuments(filter);

    // Map challenge to include participant count
    const challengesWithCounts = await Promise.all(
      challenges.map(async (chall) => {
        const count = await ChallengeParticipation.countDocuments({
          challenge: chall._id,
          approvalStatus: { $in: ['Approved', 'Pending'] }
        });
        return {
          ...chall.toObject(),
          participantCount: count
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        challenges: challengesWithCounts,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Challenge Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving challenges'
    });
  }
};

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Private
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('category', 'name type')
      .populate('createdBy', 'name email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const count = await ChallengeParticipation.countDocuments({
      challenge: challenge._id,
      approvalStatus: { $in: ['Approved', 'Pending'] }
    });

    const userPart = await ChallengeParticipation.findOne({
      challenge: challenge._id,
      employee: req.user._id
    });

    return res.status(200).json({
      success: true,
      data: {
        ...challenge.toObject(),
        participantCount: count,
        userParticipation: userPart
      }
    });
  } catch (error) {
    console.error(`[Challenge GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching challenge details'
    });
  }
};

// @desc    Create challenge
// @route   POST /api/challenges
// @access  Private (Admin or ESG Manager Only)
const createChallenge = async (req, res) => {
  try {
    const { title, category, description, xp, difficulty, evidenceRequired, startDate, deadline, maxParticipants, status } = req.body;

    const challenge = await Challenge.create({
      title,
      category,
      description,
      xp: Number(xp) || 0,
      difficulty: difficulty || 'Medium',
      evidenceRequired: evidenceRequired !== undefined ? evidenceRequired : true,
      startDate: new Date(startDate),
      deadline: new Date(deadline),
      maxParticipants: Number(maxParticipants),
      status: status || 'Draft',
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });
  } catch (error) {
    console.error(`[Challenge Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating challenge'
    });
  }
};

// @desc    Update challenge
// @route   PUT /api/challenges/:id
// @access  Private (Admin or ESG Manager Only)
const updateChallenge = async (req, res) => {
  try {
    const { title, category, description, xp, difficulty, evidenceRequired, startDate, deadline, maxParticipants, status } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (title !== undefined) challenge.title = title;
    if (category !== undefined) challenge.category = category;
    if (description !== undefined) challenge.description = description;
    if (xp !== undefined) challenge.xp = Number(xp);
    if (difficulty !== undefined) challenge.difficulty = difficulty;
    if (evidenceRequired !== undefined) challenge.evidenceRequired = evidenceRequired;
    if (startDate !== undefined) challenge.startDate = new Date(startDate);
    if (deadline !== undefined) challenge.deadline = new Date(deadline);
    if (maxParticipants !== undefined) challenge.maxParticipants = Number(maxParticipants);
    if (status !== undefined) {
      // Validate challenge status transition logic
      // e.g. Draft -> Active -> Under Review -> Completed
      challenge.status = status;
    }

    await challenge.save();

    return res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      data: challenge
    });
  } catch (error) {
    console.error(`[Challenge Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating challenge'
    });
  }
};

// @desc    Delete challenge
// @route   DELETE /api/challenges/:id
// @access  Private (Admin or ESG Manager Only)
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const hasUsers = await ChallengeParticipation.exists({ challenge: req.params.id });
    if (hasUsers) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete challenge: Employees have already enrolled'
      });
    }

    await Challenge.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    console.error(`[Challenge Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting challenge'
    });
  }
};

// @desc    Join a challenge
// @route   POST /api/challenges/:id/join
// @access  Private (Employee Only)
const joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (challenge.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not currently open for registrations'
      });
    }

    if (new Date() > new Date(challenge.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'This challenge deadline has expired'
      });
    }

    // Verify limit
    const enrolled = await ChallengeParticipation.countDocuments({
      challenge: challenge._id,
      approvalStatus: { $in: ['Approved', 'Pending'] }
    });

    if (enrolled >= challenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Maximum participation capacity reached'
      });
    }

    // Check duplicate
    const duplicate = await ChallengeParticipation.findOne({
      challenge: challenge._id,
      employee: req.user._id
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this challenge'
      });
    }

    const participation = await ChallengeParticipation.create({
      challenge: challenge._id,
      employee: req.user._id,
      progress: 0,
      approvalStatus: 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in challenge',
      data: participation
    });
  } catch (error) {
    console.error(`[Challenge Join Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error joining challenge'
    });
  }
};

// @desc    Submit proof and progress for challenge
// @route   POST /api/challenges/:id/submit
// @access  Private (Employee Only)
const submitChallengeSubmission = async (req, res) => {
  try {
    const { progress, submissionNotes } = req.body;
    const participation = await ChallengeParticipation.findOne({
      challenge: req.params.id,
      employee: req.user._id
    }).populate('challenge');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Challenge registration not found'
      });
    }

    // Enforce deadline
    if (new Date() > new Date(participation.challenge.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Submission failed: Challenge deadline has passed'
      });
    }

    if (participation.challenge.evidenceRequired && !req.file && !participation.proofFile) {
      return res.status(400).json({
        success: false,
        message: 'Evidence required: You must upload proof to submit this challenge'
      });
    }

    if (req.file) {
      participation.proofFile = `/uploads/${req.file.filename}`;
    }

    participation.submissionNotes = submissionNotes || '';
    participation.progress = progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : 100;
    participation.approvalStatus = 'Pending'; // reset status to Pending for review

    await participation.save();

    // Optionally shift challenge master status to Under Review
    if (participation.challenge.status === 'Active') {
      participation.challenge.status = 'Under Review';
      await participation.challenge.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Challenge progress submitted successfully for review',
      data: participation
    });
  } catch (error) {
    console.error(`[Challenge Submit Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during challenge submission'
    });
  }
};

// @desc    Get all challenge participations (For Manager reviews)
// @route   GET /api/challenges/submissions/all
// @access  Private (Admin or ESG Manager Only)
const getSubmissions = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query);

    const submissions = await ChallengeParticipation.find(filter)
      .populate('employee', 'name email department')
      .populate('challenge', 'title xp difficulty')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ChallengeParticipation.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Challenge Submissions Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving challenge submissions'
    });
  }
};

// @desc    Get personal challenge history
// @route   GET /api/challenges/submissions/me
// @access  Private (Employee Only)
const getMyChallenges = async (req, res) => {
  try {
    const history = await ChallengeParticipation.find({ employee: req.user._id })
      .populate('challenge')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error(`[Challenge Me Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching challenge history'
    });
  }
};

// @desc    Review challenge participation submission (ESG Manager/Admin)
// @route   POST /api/challenges/submissions/:id/review
// @access  Private (Admin or ESG Manager Only)
const reviewChallengeSubmission = async (req, res) => {
  try {
    const { approvalStatus, reviewNotes } = req.body;
    const participation = await ChallengeParticipation.findById(req.params.id)
      .populate('challenge')
      .populate('employee', 'name email');

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Challenge participation record not found'
      });
    }

    if (participation.approvalStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This submission has already been reviewed'
      });
    }

    // Validation
    if (approvalStatus === 'Rejected' && (!reviewNotes || reviewNotes.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Review notes are mandatory when rejecting challenge submissions'
      });
    }

    participation.approvalStatus = approvalStatus;
    participation.reviewNotes = reviewNotes || '';
    participation.reviewedBy = req.user._id;
    participation.completionDate = approvalStatus === 'Approved' ? new Date() : null;

    if (approvalStatus === 'Approved') {
      participation.xpAwarded = participation.challenge.xp || 0;
      participation.progress = 100;
    } else {
      participation.xpAwarded = 0;
    }

    await participation.save();

    // Award points
    if (approvalStatus === 'Approved' && participation.xpAwarded > 0) {
      await adjustUserPoints(
        participation.employee._id,
        participation.xpAwarded,
        'Challenge',
        `Completed Challenge: ${participation.challenge.title}`,
        participation._id
      );
    }

    // Send notification
    await createNotification({
      userId: participation.employee._id,
      title: approvalStatus === 'Approved' ? 'Challenge Completed!' : 'Challenge Submission Rejected',
      message: approvalStatus === 'Approved'
        ? `Your submission for challenge "${participation.challenge.title}" was approved! Earned ${participation.xpAwarded} XP.`
        : `Your submission for challenge "${participation.challenge.title}" was rejected. Notes: ${reviewNotes}`,
      type: 'Challenge',
      relatedEntityType: 'Challenge',
      relatedEntityId: participation.challenge._id
    });

    return res.status(200).json({
      success: true,
      message: `Challenge submission updated to: ${approvalStatus}`,
      data: participation
    });
  } catch (error) {
    console.error(`[Challenge Review Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error reviewing challenge submission'
    });
  }
};

// @desc    Update progress on a challenge
// @route   PUT /api/challenges/participations/:id/progress
// @access  Private (Employee Only)
const updateChallengeProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const participation = await ChallengeParticipation.findById(req.params.id);

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Challenge participation record not found'
      });
    }

    // Verify ownership
    if (participation.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You cannot update progress for this record'
      });
    }

    participation.progress = Math.min(100, Math.max(0, Number(progress)));
    await participation.save();

    return res.status(200).json({
      success: true,
      message: 'Challenge progress updated successfully',
      data: participation
    });
  } catch (error) {
    console.error(`[Challenge Progress Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating challenge progress'
    });
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  submitChallengeSubmission,
  getSubmissions,
  getMyChallenges,
  reviewChallengeSubmission,
  updateChallengeProgress
};
