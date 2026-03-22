const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  applySeller,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/apply-seller', protect, applySeller);

module.exports = router;
