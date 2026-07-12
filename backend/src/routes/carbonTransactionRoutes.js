const express = require('express');
const router = express.Router();
const { getCarbonTransactions, getCarbonTransactionById, createCarbonTransaction, updateCarbonTransaction, deleteCarbonTransaction } = require('../controllers/carbonTransactionController');
const { protect, authorize } = require('../middleware/auth');
const { carbonTransactionRules } = require('../validators/carbonTransactionValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getCarbonTransactions);
router.get('/:id', getCarbonTransactionById);

// Admin or ESG Manager permission required for modifications
router.post('/', authorize(['Admin', 'ESG Manager']), carbonTransactionRules, validate, createCarbonTransaction);
router.put('/:id', authorize(['Admin', 'ESG Manager']), carbonTransactionRules, validate, updateCarbonTransaction);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deleteCarbonTransaction);

module.exports = router;
