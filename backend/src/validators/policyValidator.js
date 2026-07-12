const { body } = require('express-validator');

const policyRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),
  body('policyCode')
    .notEmpty()
    .withMessage('Policy code is required')
    .trim()
];

module.exports = {
  policyRules
};
