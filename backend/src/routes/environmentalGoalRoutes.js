const express = require('express');
const router = express.Router();
const { getEnvironmentalGoals, getEnvironmentalGoalById, createEnvironmentalGoal, updateEnvironmentalGoal, deleteEnvironmentalGoal } = require('../controllers/environmentalGoalController');
const { protect, authorize } = require('../middleware/auth');
const { environmentalGoalRules } = require('../validators/environmentalGoalValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getEnvironmentalGoals);
router.get('/:id', getEnvironmentalGoalById);

router.post('/', authorize(['Admin', 'ESG Manager']), environmentalGoalRules, validate, createEnvironmentalGoal);
router.put('/:id', authorize(['Admin', 'ESG Manager']), environmentalGoalRules, validate, updateEnvironmentalGoal);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deleteEnvironmentalGoal);

module.exports = router;
