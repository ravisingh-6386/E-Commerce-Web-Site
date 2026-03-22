const User = require('../models/User');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc  Get user profile
// @route GET /api/users/profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name images price discountedPrice brand category');
  res.json({ success: true, user });
};

// @desc  Update user profile
// @route PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { name, phone, address, sellerBio, businessName, businessAddress } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };
  if (sellerBio !== undefined) user.sellerBio = sellerBio;
  if (businessName !== undefined) user.businessName = businessName;
  if (businessAddress !== undefined) user.businessAddress = businessAddress;

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user: user.toJSON() });
};

// @desc  Upload / update avatar
// @route PUT /api/users/avatar
const updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  const user = await User.findById(req.user._id);

  // Remove old avatar from Cloudinary
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  user.avatar = req.file.path;
  user.avatarPublicId = req.file.filename;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, avatar: user.avatar });
};

// @desc  Change password
// @route PUT /api/users/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

// @desc  Toggle wishlist item
// @route PUT /api/users/wishlist/:productId
const toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.productId;

  const exists = user.wishlist.some((id) => id.toString() === productId);

  if (exists) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    user.wishlist.push(productId);
  }

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, wishlist: user.wishlist, added: !exists });
};

// @desc  Get public seller profile
// @route GET /api/users/seller/:id
const getSellerProfile = async (req, res) => {
  const seller = await User.findById(req.params.id)
    .select('name avatar businessName sellerBio totalSales createdAt');

  if (!seller || seller.sellerStatus !== 'approved') {
    return res.status(404).json({ success: false, message: 'Seller not found' });
  }

  const products = await Product.find({ seller: seller._id, isActive: true, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  res.json({ success: true, seller, products });
};

// @desc  Get notifications
// @route GET /api/users/notifications
const getNotifications = async (req, res) => {
  const Notification = require('../models/Notification');
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  res.json({ success: true, notifications });
};

// @desc  Mark notification as read
// @route PUT /api/users/notifications/:id/read
const markNotificationRead = async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true }
  );
  res.json({ success: true });
};

// @desc  Mark all notifications as read
// @route PUT /api/users/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ success: true });
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  toggleWishlist,
  getSellerProfile,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
