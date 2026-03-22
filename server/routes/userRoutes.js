const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');
const {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  toggleWishlist,
  getSellerProfile,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadAvatar.single('avatar'), updateAvatar);
router.put('/change-password', protect, changePassword);
router.put('/wishlist/:productId', protect, toggleWishlist);
router.get('/seller/:id', getSellerProfile);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
