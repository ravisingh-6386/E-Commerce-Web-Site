const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

// @desc  Dashboard stats
// @route GET /api/admin/stats
const getStats = async (req, res) => {
  const [
    totalUsers,
    totalSellers,
    pendingSellers,
    totalProducts,
    totalOrders,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ sellerStatus: 'approved' }),
    User.countDocuments({ sellerStatus: 'pending' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  res.json({
    success: true,
    stats: { totalUsers, totalSellers, pendingSellers, totalProducts, totalOrders, revenue },
  });
};

// @desc  Get all users
// @route GET /api/admin/users
const getUsers = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = req.query.search;

  const filter = {};
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, page, pages: Math.ceil(total / limit), total });
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isActive: user.isActive });
};

// @desc  Approve / reject seller application
// @route PUT /api/admin/sellers/:id/status
const updateSellerStatus = async (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.sellerStatus = status;
  if (status === 'approved') user.role = 'seller';
  await user.save({ validateBeforeSave: false });

  await Notification.create({
    user: user._id,
    type: status === 'approved' ? 'seller_approved' : 'seller_rejected',
    title: status === 'approved' ? 'Seller Account Approved!' : 'Seller Application Rejected',
    message:
      status === 'approved'
        ? 'Congratulations! You can now list products on MotoParts.'
        : 'Your seller application was not approved. Contact support for details.',
    link: '/profile',
  });

  res.json({ success: true, message: `Seller ${status}` });
};

// @desc  Get pending sellers
// @route GET /api/admin/sellers/pending
const getPendingSellers = async (req, res) => {
  const sellers = await User.find({ sellerStatus: 'pending' })
    .select('name email businessName sellerBio businessAddress createdAt')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ success: true, sellers });
};

// @desc  Get all products (admin)
// @route GET /api/admin/products
const getAllProducts = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find()
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(),
  ]);

  res.json({ success: true, products, page, pages: Math.ceil(total / limit), total });
};

// @desc  Toggle product approved/unapproved
// @route PUT /api/admin/products/:id/toggle-approve
const toggleProductApproval = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.isApproved = !product.isApproved;
  await product.save();

  if (!product.isApproved) {
    await Notification.create({
      user: product.seller,
      type: 'product_removed',
      title: 'Product Listing Suspended',
      message: `Your listing "${product.name}" has been suspended by admin.`,
      link: '/seller/products',
    });
  }

  res.json({ success: true, isApproved: product.isApproved });
};

// @desc  Hard delete product (admin)
// @route DELETE /api/admin/products/:id
const adminDeleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  await Promise.all(product.images.map((img) => cloudinary.uploader.destroy(img.publicId)));
  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted by admin' });
};

// @desc  Get all orders (admin)
// @route GET /api/admin/orders
const getAllOrders = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(),
  ]);

  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
};

module.exports = {
  getStats,
  getUsers,
  toggleUserActive,
  updateSellerStatus,
  getPendingSellers,
  getAllProducts,
  toggleProductApproval,
  adminDeleteProduct,
  getAllOrders,
};
