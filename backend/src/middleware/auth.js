const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT
 */
const protect = async (req, res, next) => {
  try {
    let token = '';

    // Check header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check cookies for token
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_secure_secret');

    // Find User
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid user session'
      });
    }

    // Check status
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your account is inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Error] ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Session expired or invalid'
    });
  }
};

/**
 * Role authorization middleware factory
 * @param {string[]} roles - Allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Unauthenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
