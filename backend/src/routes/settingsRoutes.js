const express = require('express');
const router = express.Router();
const { getOrgSettings, updateOrgSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getOrgSettings);
router.put('/', authorize(['Admin']), updateOrgSettings);

module.exports = router;
