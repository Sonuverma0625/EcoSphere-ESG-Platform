const { body } = require('express-validator');

const rewardRules = [
  body('name')
    .notEmpty()
    .withMessage('Reward name is required')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Reward description is required')
    .trim(),
  body('pointsRequired')
    .isInt({ min: 0 })
    .withMessage('Points required must be a non-negative integer'),
  body('availableStock')
    .isInt({ min: 0 })
    .withMessage('Available stock must be a non-negative integer')
];

module.exports = {
  rewardRules
};
