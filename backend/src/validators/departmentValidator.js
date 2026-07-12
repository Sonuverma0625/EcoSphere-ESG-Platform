const { body } = require('express-validator');

const departmentRules = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .trim()
];

module.exports = {
  departmentRules
};
