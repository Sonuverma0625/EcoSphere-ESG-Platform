const express = require('express');
const router = express.Router();
const { getAudits, getAuditById, createAudit, updateAudit, recordFindings, deleteAudit } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');
const { auditRules } = require('../validators/auditValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getAudits);
router.get('/:id', getAuditById);

// Auditor can update findings and scores
router.post('/:id/findings', authorize(['Auditor', 'Admin', 'ESG Manager']), recordFindings);

// CRUD restricted to Admin/ESG Manager
router.post('/', authorize(['Admin', 'ESG Manager']), auditRules, validate, createAudit);
router.put('/:id', authorize(['Admin', 'ESG Manager']), auditRules, validate, updateAudit);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deleteAudit);

module.exports = router;
