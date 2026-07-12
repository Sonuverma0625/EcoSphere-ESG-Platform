const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { signupRules, loginRules } = require('../validators/authValidator');
const validate = require('../middleware/validate');

router.post('/signup', signupRules, validate, signup);
router.post('/register', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
