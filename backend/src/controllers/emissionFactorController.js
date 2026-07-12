const EmissionFactor = require('../models/EmissionFactor');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all emission factors
// @route   GET /api/emission-factors
// @access  Private
const getEmissionFactors = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name', 'activityType']);
    
    // Support listing all for dropdown list
    let emissionFactors;
    let total;

    if (req.query.all === 'true') {
      emissionFactors = await EmissionFactor.find(filter).sort({ name: 1 });
      total = emissionFactors.length;
      return res.status(200).json({
        success: true,
        data: {
          emissionFactors,
          pagination: { total, page: 1, pages: 1, limit: total }
        }
      });
    }

    emissionFactors = await EmissionFactor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    total = await EmissionFactor.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        emissionFactors,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[EF Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving emission factors'
    });
  }
};

// @desc    Get a single emission factor by ID
// @route   GET /api/emission-factors/:id
// @access  Private
const getEmissionFactorById = async (req, res) => {
  try {
    const ef = await EmissionFactor.findById(req.params.id);
    if (!ef) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: ef
    });
  } catch (error) {
    console.error(`[EF GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving emission factor'
    });
  }
};

// @desc    Create a new emission factor
// @route   POST /api/emission-factors
// @access  Private (Admin Only)
const createEmissionFactor = async (req, res) => {
  try {
    const { name, activityType, unit, factorValue, co2EquivalentUnit, source, effectiveDate, status } = req.body;

    const ef = await EmissionFactor.create({
      name,
      activityType,
      unit,
      factorValue: Number(factorValue),
      co2EquivalentUnit: co2EquivalentUnit || 'kgCO2e',
      source,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Emission factor created successfully',
      data: ef
    });
  } catch (error) {
    console.error(`[EF Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating emission factor'
    });
  }
};

// @desc    Update an emission factor
// @route   PUT /api/emission-factors/:id
// @access  Private (Admin Only)
const updateEmissionFactor = async (req, res) => {
  try {
    const { name, activityType, unit, factorValue, co2EquivalentUnit, source, effectiveDate, status } = req.body;
    const ef = await EmissionFactor.findById(req.params.id);

    if (!ef) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found'
      });
    }

    if (name !== undefined) ef.name = name;
    if (activityType !== undefined) ef.activityType = activityType;
    if (unit !== undefined) ef.unit = unit;
    if (factorValue !== undefined) ef.factorValue = Number(factorValue);
    if (co2EquivalentUnit !== undefined) ef.co2EquivalentUnit = co2EquivalentUnit;
    if (source !== undefined) ef.source = source;
    if (effectiveDate !== undefined) ef.effectiveDate = new Date(effectiveDate);
    if (status !== undefined) ef.status = status;

    await ef.save();

    return res.status(200).json({
      success: true,
      message: 'Emission factor updated successfully',
      data: ef
    });
  } catch (error) {
    console.error(`[EF Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating emission factor'
    });
  }
};

// @desc    Delete an emission factor
// @route   DELETE /api/emission-factors/:id
// @access  Private (Admin Only)
const deleteEmissionFactor = async (req, res) => {
  try {
    const ef = await EmissionFactor.findById(req.params.id);
    if (!ef) {
      return res.status(404).json({
        success: false,
        message: 'Emission factor not found'
      });
    }

    // Do not delete factors referenced by transactions
    const CarbonTransaction = require('../models/CarbonTransaction');
    const hasTx = await CarbonTransaction.exists({ emissionFactor: req.params.id });
    if (hasTx) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete emission factor: It is referenced by active carbon transactions'
      });
    }

    await EmissionFactor.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Emission factor deleted successfully'
    });
  } catch (error) {
    console.error(`[EF Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting emission factor'
    });
  }
};

module.exports = {
  getEmissionFactors,
  getEmissionFactorById,
  createEmissionFactor,
  updateEmissionFactor,
  deleteEmissionFactor
};
