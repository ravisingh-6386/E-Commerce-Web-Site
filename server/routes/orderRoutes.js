const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createOrder,
  stripeWebhook,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getSellerOrders,
} = require('../controllers/orderController');

// Stripe webhook needs raw body
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller-orders', protect, getSellerOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
