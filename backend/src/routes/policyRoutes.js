const express = require('express');
const router = express.Router();
const {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
  getAcknowledgementsList,
  getMyAcknowledgements
} = require('../controllers/policyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { policyRules } = require('../validators/policyValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/acknowledgements/all', getAcknowledgementsList);
router.get('/acknowledgements/me', getMyAcknowledgements);
router.post('/:id/acknowledge', acknowledgePolicy);

router.get('/', getPolicies);
router.get('/:id', getPolicyById);

router.post('/', authorize(['Admin', 'ESG Manager']), upload.single('document'), policyRules, validate, createPolicy);
router.put('/:id', authorize(['Admin', 'ESG Manager']), upload.single('document'), policyRules, validate, updatePolicy);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deletePolicy);

module.exports = router;
