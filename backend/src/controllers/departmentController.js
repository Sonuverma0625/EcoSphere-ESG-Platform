const Department = require('../models/Department');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all departments (Paginated, Searchable, Filterable)
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name', 'code']);
    
    const departments = await Department.find(filter)
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Department.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        departments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Dept Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving departments'
    });
  }
};

// @desc    Get a single department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code');
      
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error(`[Dept GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching department details'
    });
  }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Admin Only)
const createDepartment = async (req, res) => {
  try {
    const { name, code, head, parentDepartment, status } = req.body;

    const formattedCode = code.trim().toUpperCase();

    // Check code duplication
    const deptExists = await Department.findOne({ code: formattedCode });
    if (deptExists) {
      return res.status(400).json({
        success: false,
        message: `A department with code "${formattedCode}" already exists`
      });
    }

    const newDept = await Department.create({
      name,
      code: formattedCode,
      head: head || null,
      parentDepartment: parentDepartment || null,
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDept
    });
  } catch (error) {
    console.error(`[Dept Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating department'
    });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (Admin Only)
const updateDepartment = async (req, res) => {
  try {
    const { name, code, head, parentDepartment, status } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (formattedCode !== department.code) {
        // Verify no conflicts
        const codeConflict = await Department.findOne({ code: formattedCode });
        if (codeConflict) {
          return res.status(400).json({
            success: false,
            message: `A department with code "${formattedCode}" already exists`
          });
        }
        department.code = formattedCode;
      }
    }

    if (name !== undefined) department.name = name;
    if (head !== undefined) department.head = head || null;
    if (parentDepartment !== undefined) department.parentDepartment = parentDepartment || null;
    if (status !== undefined) department.status = status;

    await department.save();

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error(`[Dept Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating department'
    });
  }
};

// @desc    Delete a department (Confirm no active references)
// @route   DELETE /api/departments/:id
// @access  Private (Admin Only)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Do not delete departments that are referenced by completed transactions
    // (Check CarbonTransaction, CSRActivity, ESGPolicy, etc. reference lists)
    const CarbonTransaction = require('../models/CarbonTransaction');
    const hasTx = await CarbonTransaction.exists({ department: req.params.id });
    if (hasTx) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department: Associated carbon transactions exist'
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error(`[Dept Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting department'
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
