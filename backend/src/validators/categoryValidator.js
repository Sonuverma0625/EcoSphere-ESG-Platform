const { body } = require('express-validator');

const categoryRules = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim(),
  body('type')
    .isIn(['CSR Activity', 'Challenge', 'Compliance'])
    .withMessage('Allowed types: CSR Activity, Challenge, Compliance')
];

module.exports = {
  categoryRules
};
