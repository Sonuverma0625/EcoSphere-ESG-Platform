const express = require('express');
const router = express.Router();
const {
  getEnvironmentalReport,
  getSocialReport,
  getGovernanceReport,
  getESGSummaryReport,
  getCustomReport,
  exportCSV,
  exportPDF
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize(['Admin', 'ESG Manager']));

router.get('/environmental', getEnvironmentalReport);
router.get('/social', getSocialReport);
router.get('/governance', getGovernanceReport);
router.get('/esg-summary', getESGSummaryReport);
router.post('/custom', getCustomReport);
router.post('/export/csv', exportCSV);
router.post('/export/pdf', exportPDF);

module.exports = router;
