const { body } = require('express-validator');

const environmentalGoalRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('metric')
    .notEmpty()
    .withMessage('Metric is required')
    .trim(),
  body('baselineValue')
    .isNumeric()
    .withMessage('Baseline value must be a number'),
  body('targetValue')
    .isNumeric()
    .withMessage('Target value must be a number'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)')
];

module.exports = {
  environmentalGoalRules
};
