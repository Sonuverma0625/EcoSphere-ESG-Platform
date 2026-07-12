const express = require('express');
const router = express.Router();
const { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { departmentRules } = require('../validators/departmentValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorize(['Admin']), departmentRules, validate, createDepartment);
router.put('/:id', authorize(['Admin']), departmentRules, validate, updateDepartment);
router.delete('/:id', authorize(['Admin']), deleteDepartment);

module.exports = router;
