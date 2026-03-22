const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc  Get reviews for a product
// @route GET /api/reviews/:productId
const getProductReviews = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: req.params.productId }),
  ]);

  res.json({ success: true, reviews, page, pages: Math.ceil(total / limit), total });
};

// @desc  Create or update review
// @route POST /api/reviews/:productId
const createReview = async (req, res) => {
  const { rating, title, comment } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Check if the user purchased this product
  const hasPurchased = await Order.exists({
    buyer: req.user._id,
    'items.product': productId,
    status: 'delivered',
  });

  const existing = await Review.findOne({ product: productId, user: req.user._id });

  if (existing) {
    existing.rating = Number(rating);
    existing.title = title;
    existing.comment = comment;
    await existing.save();
    return res.json({ success: true, review: existing });
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating: Number(rating),
    title,
    comment,
    isVerifiedPurchase: !!hasPurchased,
  });

  res.status(201).json({ success: true, review });
};

// @desc  Delete review
// @route DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
};

// @desc  Vote review as helpful
// @route PUT /api/reviews/:id/helpful
const voteHelpful = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const votedIdx = review.helpfulVotes.indexOf(req.user._id);
  if (votedIdx === -1) {
    review.helpfulVotes.push(req.user._id);
  } else {
    review.helpfulVotes.splice(votedIdx, 1);
  }
  await review.save();

  res.json({ success: true, helpfulCount: review.helpfulVotes.length });
};

module.exports = { getProductReviews, createReview, deleteReview, voteHelpful };
