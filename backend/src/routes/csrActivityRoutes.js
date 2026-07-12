const express = require('express');
const router = express.Router();
const {
  getCSRActivities,
  getCSRActivityById,
  createCSRActivity,
  updateCSRActivity,
  deleteCSRActivity,
  joinCSRActivity,
  submitCSRProof,
  getParticipations,
  getMyParticipations,
  reviewCSRParticipation
} = require('../controllers/csrActivityController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { csrActivityRules } = require('../validators/csrActivityValidator');
const validate = require('../middleware/validate');

router.use(protect);

// Participations review list & user history
router.get('/participations/all', authorize(['Admin', 'ESG Manager']), getParticipations);
router.get('/participations/me', getMyParticipations);
router.post('/participations/:id/review', authorize(['Admin', 'ESG Manager']), reviewCSRParticipation);

// Core CRUD
router.get('/', getCSRActivities);
router.get('/:id', getCSRActivityById);
router.post('/', authorize(['Admin', 'ESG Manager']), csrActivityRules, validate, createCSRActivity);
router.put('/:id', authorize(['Admin', 'ESG Manager']), csrActivityRules, validate, updateCSRActivity);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deleteCSRActivity);

// Employee actions
router.post('/:id/join', joinCSRActivity);
router.post('/:id/register', joinCSRActivity); // Alias for frontend compatibility
router.post('/:id/submit-proof', upload.single('proof'), submitCSRProof);
router.post('/:id/complete', upload.single('proof'), submitCSRProof); // Alias for frontend compatibility

module.exports = router;
