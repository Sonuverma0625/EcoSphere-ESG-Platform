const express = require('express');
const router = express.Router();
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { categoryRules } = require('../validators/categoryValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authorize(['Admin']), categoryRules, validate, createCategory);
router.put('/:id', authorize(['Admin']), categoryRules, validate, updateCategory);
router.delete('/:id', authorize(['Admin']), deleteCategory);

module.exports = router;
