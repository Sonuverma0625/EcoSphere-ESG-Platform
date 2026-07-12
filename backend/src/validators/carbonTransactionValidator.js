const { body } = require('express-validator');

const carbonTransactionRules = [
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('activityType')
    .notEmpty()
    .withMessage('Activity type is required')
    .trim(),
  body('sourceModule')
    .isIn(['Purchase', 'Manufacturing', 'Expense', 'Fleet', 'Manual', 'Facility', 'Travel'])
    .withMessage('Allowed source modules: Purchase, Manufacturing, Expense, Fleet, Manual, Facility, Travel'),
  body('activityQuantity')
    .isNumeric()
    .withMessage('Activity quantity must be a number'),
  body('unit')
    .optional()
    .notEmpty()
    .withMessage('Unit cannot be empty if provided')
    .trim()
];

module.exports = {
  carbonTransactionRules
};
