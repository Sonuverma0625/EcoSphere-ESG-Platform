const { body } = require('express-validator');

const challengeRules = [
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
  body('xp')
    .isInt({ min: 0 })
    .withMessage('XP must be a positive integer'),
  body('difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date (YYYY-MM-DD)'),
  body('maxParticipants')
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer')
];

module.exports = {
  challengeRules
};
