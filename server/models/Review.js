const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// After saving/removing, recalculate product rating
const recalcRating = async (productId) => {
  const Product = mongoose.model('Product');
  const stats = await reviewSchema.statics
    ? null // handled below
    : null;

  const result = await mongoose.model('Review').aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(result[0].avgRating * 10) / 10,
      numReviews: result[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
};

reviewSchema.post('save', function () {
  recalcRating(this.product);
});

reviewSchema.post('deleteOne', { document: true }, function () {
  recalcRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
