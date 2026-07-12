const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'replace_with_secure_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, departmentCode } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Resolve department if departmentCode provided
    let departmentId = null;
    if (departmentCode) {
      const dept = await Department.findOne({ code: departmentCode.toUpperCase() });
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department code provided'
        });
      }
      departmentId = dept._id;
    }

    // Create user. Set role to 'Employee' as safety default.
    // Users must not assign themselves Admin or ESG Manager roles during signup.
    const user = await User.create({
      name,
      email,
      password,
      department: departmentId,
      role: 'Employee',
      status: 'Active'
    });

    // Update department employee count if department resolved
    if (departmentId) {
      await Department.findByIdAndUpdate(departmentId, { $inc: { employeeCount: 1 } });
    }

    // Generate token
    const token = signToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Exclude password in response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      xpCurrent: user.xpCurrent,
      xpLifetime: user.xpLifetime,
      csrPoints: user.csrPoints
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      data: userResponse
    });
  } catch (error) {
    console.error(`[Signup Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during signup registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check status
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administration.'
      });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = signToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userResponse = await User.findById(user._id).select('-password').populate('department');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: userResponse
    });
  } catch (error) {
    console.error(`[Login Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during authentication'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000)
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user session
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('department');
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`[GetMe Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving session profile'
    });
  }
};

// @desc    Forgot password flow - sign short lived JWT for reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email address'
      });
    }

    // Sign a 15-minute token for password resetting
    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' },
      process.env.JWT_SECRET || 'replace_with_secure_secret',
      { expiresIn: '15m' }
    );

    // Logs the reset token for developer verification and returns mock trigger success
    console.log(`[Forgot Password] Reset token generated for user: ${email}`);
    console.log(`Reset Token: ${resetToken}`);

    // If emails are configured, it could send an email. But in-app log satisfies proof.
    return res.status(200).json({
      success: true,
      message: 'Password reset token generated. Check terminal console.',
      token: resetToken // Expose for testing/demo flow convenience
    });
  } catch (error) {
    console.error(`[ForgotPwd Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error during password recovery setup'
    });
  }
};

// @desc    Reset password flow using valid reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing reset token or password fields'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_secure_secret');
    if (decoded.type !== 'reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token payload'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login.'
    });
  } catch (error) {
    console.error(`[ResetPwd Error] ${error.message}`);
    return res.status(400).json({
      success: false,
      message: 'Expired or invalid password reset token'
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword
};

