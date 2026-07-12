const EnvironmentalGoal = require('../models/EnvironmentalGoal');
const { parseQueryParams } = require('../utils/apiFeatures');
const { recalculateESGScores } = require('../services/scoreService');

// Helper to compute progress and status
const calculateGoalMetrics = (baseline, target, current, endDate) => {
  let progress = 0;
  if (target > 0) {
    progress = Math.round((current / target) * 100);
  }
  progress = Math.max(0, Math.min(100, progress));

  let status = 'In Progress';
  if (current === 0 && progress === 0) {
    status = 'Not Started';
  } else if (progress >= 100) {
    status = 'Completed';
  } else if (new Date(endDate) < new Date() && progress < 100) {
    status = 'At Risk';
  }

  return {
    progressPercentage: progress,
    status
  };
};

// @desc    Get all environmental goals
// @route   GET /api/environmental-goals
// @access  Private
const getEnvironmentalGoals = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['title', 'metric']);

    const goals = await EnvironmentalGoal.find(filter)
      .populate('department', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await EnvironmentalGoal.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        goals,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Goal Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving environmental goals'
    });
  }
};

// @desc    Get single goal
// @route   GET /api/environmental-goals/:id
// @access  Private
const getEnvironmentalGoalById = async (req, res) => {
  try {
    const goal = await EnvironmentalGoal.findById(req.params.id).populate('department', 'name code');
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Environmental goal not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error(`[Goal GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching goal details'
    });
  }
};

// @desc    Create environmental goal
// @route   POST /api/environmental-goals
// @access  Private (Admin or ESG Manager Only)
const createEnvironmentalGoal = async (req, res) => {
  try {
    const { title, department, metric, baselineValue, targetValue, currentValue, startDate, endDate } = req.body;

    const base = Number(baselineValue);
    const targ = Number(targetValue);
    const curr = Number(currentValue) || 0;

    const { progressPercentage, status } = calculateGoalMetrics(base, targ, curr, endDate);

    const goal = await EnvironmentalGoal.create({
      title,
      department,
      metric,
      baselineValue: base,
      targetValue: targ,
      currentValue: curr,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      progressPercentage,
      status
    });

    // Score update
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Goal created: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Environmental goal created successfully',
      data: goal
    });
  } catch (error) {
    console.error(`[Goal Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating environmental goal'
    });
  }
};

// @desc    Update environmental goal
// @route   PUT /api/environmental-goals/:id
// @access  Private (Admin or ESG Manager Only)
const updateEnvironmentalGoal = async (req, res) => {
  try {
    const { title, department, metric, baselineValue, targetValue, currentValue, startDate, endDate, status: customStatus } = req.body;
    const goal = await EnvironmentalGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Environmental goal not found'
      });
    }

    if (title !== undefined) goal.title = title;
    if (department !== undefined) goal.department = department;
    if (metric !== undefined) goal.metric = metric;
    if (startDate !== undefined) goal.startDate = new Date(startDate);
    if (endDate !== undefined) goal.endDate = new Date(endDate);

    const base = baselineValue !== undefined ? Number(baselineValue) : goal.baselineValue;
    const targ = targetValue !== undefined ? Number(targetValue) : goal.targetValue;
    const curr = currentValue !== undefined ? Number(currentValue) : goal.currentValue;

    goal.baselineValue = base;
    goal.targetValue = targ;
    goal.currentValue = curr;

    const activeEndDate = endDate !== undefined ? endDate : goal.endDate;
    const { progressPercentage, status } = calculateGoalMetrics(base, targ, curr, activeEndDate);

    goal.progressPercentage = progressPercentage;
    
    // Allow custom override if passed, else compute
    goal.status = customStatus || status;

    await goal.save();

    // Recalculate scores
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Goal updated: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Environmental goal updated successfully',
      data: goal
    });
  } catch (error) {
    console.error(`[Goal Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating environmental goal'
    });
  }
};

// @desc    Delete environmental goal
// @route   DELETE /api/environmental-goals/:id
// @access  Private (Admin or ESG Manager Only)
const deleteEnvironmentalGoal = async (req, res) => {
  try {
    const goal = await EnvironmentalGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Environmental goal not found'
      });
    }

    await EnvironmentalGoal.findByIdAndDelete(req.params.id);

    // Recalculate scores
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Goal deleted: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Environmental goal deleted successfully'
    });
  } catch (error) {
    console.error(`[Goal Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting goal'
    });
  }
};

module.exports = {
  getEnvironmentalGoals,
  getEnvironmentalGoalById,
  createEnvironmentalGoal,
  updateEnvironmentalGoal,
  deleteEnvironmentalGoal
};
