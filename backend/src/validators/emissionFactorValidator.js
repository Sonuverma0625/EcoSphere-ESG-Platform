const { body } = require('express-validator');

const emissionFactorRules = [
  body('name')
    .notEmpty()
    .withMessage('Emission factor name is required')
    .trim(),
  body('activityType')
    .notEmpty()
    .withMessage('Activity type is required')
    .trim(),
  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .trim(),
  body('factorValue')
    .isNumeric()
    .withMessage('Factor value must be a number')
];

module.exports = {
  emissionFactorRules
};
