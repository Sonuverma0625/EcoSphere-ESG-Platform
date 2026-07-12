const CarbonTransaction = require('../models/CarbonTransaction');
const EmissionFactor = require('../models/EmissionFactor');
const { getSettings } = require('../services/settingsService');
const { recalculateESGScores } = require('../services/scoreService');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all carbon transactions (Paginated, Searchable, Filterable)
// @route   GET /api/carbon-transactions
// @access  Private
const getCarbonTransactions = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['notes', 'activityType']);

    // Set custom dateField for parser
    if (req.query.startDate || req.query.endDate) {
      req.query.dateField = 'transactionDate';
      // Re-parse with the correct dateField
      const parsed = parseQueryParams(req.query, ['notes', 'activityType']);
      Object.assign(filter, parsed.filter);
    }

    const transactions = await CarbonTransaction.find(filter)
      .populate('department', 'name code')
      .populate('emissionFactor', 'name factorValue unit')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await CarbonTransaction.countDocuments(filter);

    // Sum total emissions for the filtered subset
    const sumResult = await CarbonTransaction.aggregate([
      { $match: filter },
      { $group: { _id: null, totalEmissions: { $sum: '$calculatedEmission' } } }
    ]);
    const totalEmissionsSum = sumResult.length > 0 ? sumResult[0].totalEmissions : 0;

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        totalEmissionsSum,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[TX Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving carbon transactions'
    });
  }
};

// @desc    Get single carbon transaction
// @route   GET /api/carbon-transactions/:id
// @access  Private
const getCarbonTransactionById = async (req, res) => {
  try {
    const transaction = await CarbonTransaction.findById(req.params.id)
      .populate('department', 'name code')
      .populate('emissionFactor', 'name factorValue unit')
      .populate('createdBy', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Carbon transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(`[TX GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching carbon transaction details'
    });
  }
};

// @desc    Create a carbon transaction
// @route   POST /api/carbon-transactions
// @access  Private (Admin or ESG Manager Only)
const createCarbonTransaction = async (req, res) => {
  try {
    const { department, activityType, sourceModule, activityQuantity, transactionDate, notes, calculatedEmissionManual } = req.body;
    const settings = await getSettings();

    // Auto-derive unit from activityType if not provided
    const UNIT_MAP = {
      'electricity': 'kWh',
      'diesel': 'liters',
      'flight': 'km',
      'natural-gas': 'm3',
      'petrol': 'liters',
      'coal': 'kg',
      'water': 'm3'
    };
    const unit = req.body.unit || UNIT_MAP[activityType] || 'kWh';

    let calculatedEmission = 0;
    let emissionFactorId = null;
    let isManual = false;

    if (settings.autoEmissionCalculation && sourceModule !== 'Manual') {
      // Find matching active emission factor by activityType only
      const ef = await EmissionFactor.findOne({
        activityType,
        status: 'Active'
      });

      if (!ef) {
        // Graceful fallback: use manual = 0 instead of erroring out
        calculatedEmission = 0;
        isManual = true;
      } else {
        calculatedEmission = Number(activityQuantity) * ef.factorValue;
        emissionFactorId = ef._id;
      }
    } else {
      // Manual emission transaction
      calculatedEmission = Number(calculatedEmissionManual) || 0;
      isManual = true;
    }

    const tx = await CarbonTransaction.create({
      department,
      activityType,
      sourceModule,
      activityQuantity: Number(activityQuantity),
      unit,
      emissionFactor: emissionFactorId,
      calculatedEmission,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      notes,
      createdBy: req.user._id,
      isManual
    });

    // Async trigger of score update
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Carbon Transaction created: ${err.message}`);
    });

    return res.status(201).json({
      success: true,
      message: 'Carbon transaction logged successfully',
      data: tx
    });
  } catch (error) {
    console.error(`[TX Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error logging carbon transaction'
    });
  }
};

// @desc    Update a carbon transaction
// @route   PUT /api/carbon-transactions/:id
// @access  Private (Admin or ESG Manager Only)
const updateCarbonTransaction = async (req, res) => {
  try {
    const { department, activityType, sourceModule, activityQuantity, unit, transactionDate, notes, calculatedEmissionManual } = req.body;
    const transaction = await CarbonTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Carbon transaction not found'
      });
    }

    const settings = await getSettings();

    // Re-verify fields
    if (department !== undefined) transaction.department = department;
    if (sourceModule !== undefined) transaction.sourceModule = sourceModule;
    if (notes !== undefined) transaction.notes = notes;
    if (transactionDate !== undefined) transaction.transactionDate = new Date(transactionDate);

    const activeType = activityType !== undefined ? activityType : transaction.activityType;
    const activeUnit = unit !== undefined ? unit : transaction.unit;
    const activeQty = activityQuantity !== undefined ? Number(activityQuantity) : transaction.activityQuantity;

    transaction.activityType = activeType;
    transaction.unit = activeUnit;
    transaction.activityQuantity = activeQty;

    const currentSource = sourceModule !== undefined ? sourceModule : transaction.sourceModule;

    if (settings.autoEmissionCalculation && currentSource !== 'Manual') {
      const ef = await EmissionFactor.findOne({
        activityType: activeType,
        unit: activeUnit,
        status: 'Active'
      });

      if (!ef) {
        return res.status(400).json({
          success: false,
          message: `No active emission factor coefficients found matching type "${activeType}" and unit "${activeUnit}".`
        });
      }

      transaction.calculatedEmission = activeQty * ef.factorValue;
      transaction.emissionFactor = ef._id;
      transaction.isManual = false;
    } else {
      if (calculatedEmissionManual !== undefined) {
        transaction.calculatedEmission = Number(calculatedEmissionManual);
      }
      transaction.emissionFactor = null;
      transaction.isManual = true;
    }

    await transaction.save();

    // Recalculate scores
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Carbon Transaction updated: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Carbon transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error(`[TX Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating carbon transaction'
    });
  }
};

// @desc    Delete a carbon transaction
// @route   DELETE /api/carbon-transactions/:id
// @access  Private (Admin or ESG Manager Only)
const deleteCarbonTransaction = async (req, res) => {
  try {
    const transaction = await CarbonTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Carbon transaction not found'
      });
    }

    await CarbonTransaction.findByIdAndDelete(req.params.id);

    // Recalculate scores
    recalculateESGScores().catch(err => {
      console.error(`[Score Recalc Error] Carbon Transaction deleted: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      message: 'Carbon transaction deleted successfully'
    });
  } catch (error) {
    console.error(`[TX Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting carbon transaction'
    });
  }
};

module.exports = {
  getCarbonTransactions,
  getCarbonTransactionById,
  createCarbonTransaction,
  updateCarbonTransaction,
  deleteCarbonTransaction
};
