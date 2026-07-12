const express = require('express');
const router = express.Router();
const {
  getRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getRedemptionsList,
  reviewRedemption
} = require('../controllers/rewardController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { rewardRules } = require('../validators/rewardValidator');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/redemptions/all', getRedemptionsList);
router.post('/redemptions/:id/review', authorize(['Admin', 'ESG Manager']), reviewRedemption);

router.get('/', getRewards);
router.get('/:id', getRewardById);
router.post('/', authorize(['Admin']), upload.single('image'), rewardRules, validate, createReward);
router.put('/:id', authorize(['Admin']), upload.single('image'), rewardRules, validate, updateReward);
router.delete('/:id', authorize(['Admin']), deleteReward);

router.post('/:id/redeem', redeemReward);

module.exports = router;
