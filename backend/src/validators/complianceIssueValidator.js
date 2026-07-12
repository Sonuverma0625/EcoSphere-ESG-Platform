const { body } = require('express-validator');

const complianceIssueRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),
  body('severity')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Severity must be Low, Medium, High, or Critical'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim(),
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('owner')
    .isMongoId()
    .withMessage('Owner (User ID) is mandatory'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date is mandatory and must be a valid date (YYYY-MM-DD)')
];

module.exports = {
  complianceIssueRules
};
