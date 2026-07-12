const express = require('express');
const router = express.Router();
const {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  submitChallengeSubmission,
  getSubmissions,
  getMyChallenges,
  reviewChallengeSubmission,
  updateChallengeProgress
} = require('../controllers/challengeController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { challengeRules } = require('../validators/challengeValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/submissions/all', authorize(['Admin', 'ESG Manager']), getSubmissions);
router.get('/submissions/me', getMyChallenges);
router.get('/participations/me', getMyChallenges); // Frontend compatibility alias
router.put('/participations/:id/progress', updateChallengeProgress);
router.post('/submissions/:id/review', authorize(['Admin', 'ESG Manager']), reviewChallengeSubmission);

router.get('/', getChallenges);
router.get('/:id', getChallengeById);

router.post('/', authorize(['Admin', 'ESG Manager']), challengeRules, validate, createChallenge);
router.put('/:id', authorize(['Admin', 'ESG Manager']), challengeRules, validate, updateChallenge);
router.delete('/:id', authorize(['Admin', 'ESG Manager']), deleteChallenge);

router.post('/:id/join', joinChallenge);
router.post('/:id/submit', upload.single('proof'), submitChallengeSubmission);

module.exports = router;
