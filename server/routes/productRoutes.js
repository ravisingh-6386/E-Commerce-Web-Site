const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const isSeller = require('../middlewares/isSeller');
const { upload } = require('../middlewares/upload');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getFeaturedProducts,
  getMyProducts,
} = require('../controllers/productController');

router.get('/featured', getFeaturedProducts);
router.get('/my-products', protect, isSeller, getMyProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);

router.post('/', protect, isSeller, upload.array('images', 8), createProduct);
router.put('/:id', protect, isSeller, upload.array('images', 8), updateProduct);
router.delete('/:id/images/:publicId', protect, isSeller, deleteProductImage);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
