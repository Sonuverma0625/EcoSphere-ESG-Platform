const express = require('express');
const router = express.Router();
const { getBadges, getUserBadges, createBadge, updateBadge, deleteBadge, awardBadgeManually } = require('../controllers/badgeController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getBadges);
router.get('/user/:userId', getUserBadges);
router.post('/award', authorize(['Admin']), awardBadgeManually);
router.post('/', authorize(['Admin']), upload.single('icon'), createBadge);
router.put('/:id', authorize(['Admin']), upload.single('icon'), updateBadge);
router.delete('/:id', authorize(['Admin']), deleteBadge);

module.exports = router;
