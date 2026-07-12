const express = require('express');
const router = express.Router();
const { getOrgDashboard, getEnvironmentalDashboard, getSocialDashboard, getGovernanceDashboard, getEmployeeDashboard, getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/org', getOrgDashboard);
router.get('/environmental', getEnvironmentalDashboard);
router.get('/social', getSocialDashboard);
router.get('/governance', getGovernanceDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;
