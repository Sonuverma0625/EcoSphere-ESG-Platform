const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// ─── Security Middlewares ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // Very generous in development
  message: { success: false, message: 'Too many attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const ip = req.ip || req.connection.remoteAddress || '';
    return process.env.NODE_ENV !== 'production' && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');
  }
});

// ─── Body Parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/emission-factors', require('./routes/emissionFactorRoutes'));
app.use('/api/carbon-transactions', require('./routes/carbonTransactionRoutes'));
app.use('/api/environmental-goals', require('./routes/environmentalGoalRoutes'));
app.use('/api/csr-activities', require('./routes/csrActivityRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));
app.use('/api/compliance-issues', require('./routes/complianceIssueRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/badges', require('./routes/badgeRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EcoSphere ESG API is running',
    timestamp: new Date()
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Global Error] ${err.message}`);

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the 5MB limit'
    });
  }

  if (err.message && err.message.includes('Invalid File Type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  // Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists`
    });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message
  });
});

module.exports = app;
