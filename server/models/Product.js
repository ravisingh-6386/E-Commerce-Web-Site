const mongoose = require('mongoose');

const compatibleVehicleSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    yearFrom: { type: String },
    yearTo: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0, default: null },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    category: {
      type: String,
      required: true,
      enum: ['car-parts', 'bike-parts', 'superbike-parts', 'engine-parts', 'accessories'],
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ['car', 'bike', 'superbike', 'universal'],
    },
    brand: { type: String, required: true, trim: true },
    condition: {
      type: String,
      required: true,
      enum: ['new', 'used', 'refurbished'],
    },
    partNumber: { type: String, trim: true, default: '' },
    compatibleVehicles: [compatibleVehicleSchema],
    stock: { type: Number, required: true, min: 0, default: 1 },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    tags: [{ type: String }],
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    shippingDays: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
  partNumber: 'text',
});

// Compound sort/filter indexes
productSchema.index({ category: 1, vehicleType: 1, brand: 1, price: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isApproved: 1, isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
