const { body } = require('express-validator');

const csrActivityRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),
  body('category')
    .isMongoId()
    .withMessage('Valid Category ID is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim(),
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .trim(),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('maxParticipants')
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer'),
  body('pointsAwarded')
    .isInt({ min: 0 })
    .withMessage('Points awarded must be a non-negative integer')
];

module.exports = {
  csrActivityRules
};
