const { body } = require('express-validator');

const auditRules = [
  body('auditTitle')
    .notEmpty()
    .withMessage('Audit title is required')
    .trim(),
  body('auditType')
    .notEmpty()
    .withMessage('Audit type is required')
    .trim(),
  body('department')
    .isMongoId()
    .withMessage('Valid Department ID is required'),
  body('assignedAuditor')
    .isMongoId()
    .withMessage('Valid Auditor ID is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)')
];

module.exports = {
  auditRules
};
