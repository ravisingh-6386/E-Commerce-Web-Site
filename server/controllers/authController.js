const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: user.toJSON(),
  });
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  res.json({ success: true, token, user: user.toJSON() });
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name images price');
  res.json({ success: true, user });
};

// @desc  Request password reset
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal whether email exists
    return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'MotoParts – Password Reset',
    html: `<p>Hi ${user.name},</p>
           <p>Click the link below to reset your password. It expires in 30 minutes.</p>
           <a href="${resetUrl}">${resetUrl}</a>`,
  });

  res.json({ success: true, message: 'Password reset email sent' });
};

// @desc  Reset password
// @route POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful' });
};

// @desc  Apply to become a seller
// @route POST /api/auth/apply-seller
const applySeller = async (req, res) => {
  const { businessName, sellerBio, businessAddress } = req.body;
  const user = await User.findById(req.user._id);

  if (user.sellerStatus === 'approved') {
    return res.status(400).json({ success: false, message: 'Already an approved seller' });
  }

  user.businessName = businessName || '';
  user.sellerBio = sellerBio || '';
  user.businessAddress = businessAddress || '';
  user.sellerStatus = 'pending';
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Seller application submitted' });
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, applySeller };
