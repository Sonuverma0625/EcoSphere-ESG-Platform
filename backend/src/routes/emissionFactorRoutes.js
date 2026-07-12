const express = require('express');
const router = express.Router();
const { getEmissionFactors, getEmissionFactorById, createEmissionFactor, updateEmissionFactor, deleteEmissionFactor } = require('../controllers/emissionFactorController');
const { protect, authorize } = require('../middleware/auth');
const { emissionFactorRules } = require('../validators/emissionFactorValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getEmissionFactors);
router.get('/:id', getEmissionFactorById);
router.post('/', authorize(['Admin']), emissionFactorRules, validate, createEmissionFactor);
router.put('/:id', authorize(['Admin']), emissionFactorRules, validate, updateEmissionFactor);
router.delete('/:id', authorize(['Admin']), deleteEmissionFactor);

module.exports = router;
