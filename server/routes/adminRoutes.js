const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const {
  getStats,
  getUsers,
  toggleUserActive,
  updateSellerStatus,
  getPendingSellers,
  getAllProducts,
  toggleProductApproval,
  adminDeleteProduct,
  getAllOrders,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

router.get('/stats', getStats);

router.get('/users', getUsers);
router.put('/users/:id/toggle-active', toggleUserActive);

router.get('/sellers/pending', getPendingSellers);
router.put('/sellers/:id/status', updateSellerStatus);

router.get('/products', getAllProducts);
router.put('/products/:id/toggle-approve', toggleProductApproval);
router.delete('/products/:id', adminDeleteProduct);

router.get('/orders', getAllOrders);

module.exports = router;
