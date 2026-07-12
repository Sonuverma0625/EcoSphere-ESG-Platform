const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, updateProfile, deactivateUser, getAuditors } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/role/auditors', getAuditors);
router.put('/profile/me', updateProfile);
router.get('/', authorize(['Admin', 'ESG Manager', 'Auditor']), getUsers);
router.get('/:id', authorize(['Admin']), getUserById);
router.put('/:id', authorize(['Admin']), updateUser);
router.delete('/:id', authorize(['Admin']), deactivateUser);

module.exports = router;
