const User = require('../models/User');
const Department = require('../models/Department');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin Only)
const getUsers = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name', 'email']);

    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[User Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving users'
    });
  }
};

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`[User GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching user details'
    });
  }
};

// @desc    Update a user (Admin can change role, status, department)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { name, role, status, department } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent privilege escalation to Admin by non-admins
    if (role !== undefined) {
      const allowedRoles = ['Admin', 'ESG Manager', 'Employee', 'Auditor'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }
      user.role = role;
    }

    if (name !== undefined) user.name = name;
    if (status !== undefined) user.status = status;

    // Handle department change
    if (department !== undefined) {
      const oldDept = user.department;
      user.department = department || null;

      // Adjust department employee counts
      if (oldDept && oldDept.toString() !== department) {
        await Department.findByIdAndUpdate(oldDept, { $inc: { employeeCount: -1 } });
      }
      if (department) {
        await Department.findByIdAndUpdate(department, { $inc: { employeeCount: 1 } });
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password').populate('department', 'name code');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(`[User Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating user'
    });
  }
};

// @desc    Update own profile (any authenticated user)
// @route   PUT /api/users/profile/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name !== undefined) user.name = name;
    if (password !== undefined && password.length >= 6) {
      user.password = password; // will be hashed by pre-save hook
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password').populate('department', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(`[Profile Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating profile'
    });
  }
};

// @desc    Deactivate (soft-delete) a user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't delete own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    user.status = 'Inactive';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error(`[User Deactivate Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deactivating user'
    });
  }
};

// @desc    Get auditors list (for audit assignment)
// @route   GET /api/users/role/auditors
// @access  Private
const getAuditors = async (req, res) => {
  try {
    const auditors = await User.find({ role: 'Auditor', status: 'Active' })
      .select('name email')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: auditors
    });
  } catch (error) {
    console.error(`[Auditor List Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching auditors list'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateProfile,
  deactivateUser,
  getAuditors
};
