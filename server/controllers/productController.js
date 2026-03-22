const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// ── Helpers ─────────────────────────────────────────────────

const buildFilter = (query) => {
  const filter = { isActive: true, isApproved: true };
  if (query.category) filter.category = query.category;
  if (query.vehicleType) filter.vehicleType = query.vehicleType;
  if (query.brand) filter.brand = new RegExp(query.brand, 'i');
  if (query.condition) filter.condition = query.condition;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) filter.$text = { $search: query.search };
  if (query.seller) filter.seller = query.seller;
  return filter;
};

// @desc  Get all products (with search & filters)
// @route GET /api/products
const getProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = buildFilter(req.query);

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    popular: { sold: -1 },
    rating: { ratings: -1 },
  };
  const sort = sortOptions[req.query.sort] || { isFeatured: -1, createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name avatar businessName ratings')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

// @desc  Get single product
// @route GET /api/products/:id
const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name avatar businessName sellerBio phone email totalSales');

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Increment view counter (fire-and-forget)
  Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

  res.json({ success: true, product });
};

// @desc  Create product
// @route POST /api/products
const createProduct = async (req, res) => {
  const images = (req.files || []).map((f) => ({
    url: f.path,
    publicId: f.filename,
  }));

  if (images.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one image is required' });
  }

  const {
    name, description, price, discountedPrice,
    category, vehicleType, brand, condition,
    partNumber, stock, tags, weight,
    compatibleVehicles, shippingDays,
  } = req.body;

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountedPrice: discountedPrice ? Number(discountedPrice) : null,
    images,
    category,
    vehicleType,
    brand,
    condition,
    partNumber,
    stock: Number(stock) || 1,
    tags: tags ? JSON.parse(tags) : [],
    weight: weight ? Number(weight) : undefined,
    compatibleVehicles: compatibleVehicles ? JSON.parse(compatibleVehicles) : [],
    shippingDays: shippingDays ? Number(shippingDays) : 5,
    seller: req.user._id,
  });

  res.status(201).json({ success: true, product });
};

// @desc  Update product
// @route PUT /api/products/:id
const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Only seller or admin can edit
  if (
    product.seller.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const fields = [
    'name', 'description', 'price', 'discountedPrice',
    'category', 'vehicleType', 'brand', 'condition',
    'partNumber', 'stock', 'shippingDays',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  if (req.body.tags) product.tags = JSON.parse(req.body.tags);
  if (req.body.compatibleVehicles)
    product.compatibleVehicles = JSON.parse(req.body.compatibleVehicles);

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    product.images = [...product.images, ...newImages];
  }

  await product.save();
  res.json({ success: true, product });
};

// @desc  Delete a specific image from product
// @route DELETE /api/products/:id/images/:publicId
const deleteProductImage = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (
    product.seller.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { publicId } = req.params;
  await cloudinary.uploader.destroy(publicId);
  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  res.json({ success: true, images: product.images });
};

// @desc  Delete product
// @route DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (
    product.seller.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Remove images from Cloudinary
  await Promise.all(
    product.images.map((img) => cloudinary.uploader.destroy(img.publicId))
  );

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
};

// @desc  Get featured products
// @route GET /api/products/featured
const getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ isActive: true, isApproved: true, isFeatured: true })
    .populate('seller', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  res.json({ success: true, products });
};

// @desc  Get seller's own products
// @route GET /api/products/my-products
const getMyProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ seller: req.user._id }),
  ]);

  res.json({ success: true, products, page, pages: Math.ceil(total / limit), total });
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getFeaturedProducts,
  getMyProducts,
};
