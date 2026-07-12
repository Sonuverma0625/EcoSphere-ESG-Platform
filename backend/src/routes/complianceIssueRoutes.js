const express = require('express');
const router = express.Router();
const {
  getComplianceIssues,
  getComplianceIssueById,
  createComplianceIssue,
  updateComplianceIssue,
  resolveComplianceIssue,
  closeComplianceIssue
} = require('../controllers/complianceIssueController');
const { protect, authorize } = require('../middleware/auth');
const { complianceIssueRules } = require('../validators/complianceIssueValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.post('/:id/resolve', resolveComplianceIssue);
router.post('/:id/close', authorize(['Admin', 'ESG Manager']), closeComplianceIssue);

router.get('/', getComplianceIssues);
router.get('/:id', getComplianceIssueById);

router.post('/', authorize(['Admin', 'ESG Manager', 'Auditor']), complianceIssueRules, validate, createComplianceIssue);
router.put('/:id', authorize(['Admin', 'ESG Manager']), complianceIssueRules, validate, updateComplianceIssue);

module.exports = router;
