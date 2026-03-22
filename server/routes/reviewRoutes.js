const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getProductReviews,
  createReview,
  deleteReview,
  voteHelpful,
} = require('../controllers/reviewController');

router.get('/:productId', getProductReviews);
router.post('/:productId', protect, createReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, voteHelpful);

module.exports = router;
