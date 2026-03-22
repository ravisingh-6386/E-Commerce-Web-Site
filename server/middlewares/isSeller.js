const isSeller = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'seller' ||
      req.user.role === 'admin' ||
      req.user.sellerStatus === 'approved')
  ) {
    return next();
  }
  res.status(403).json({
    success: false,
    message: 'Approved seller account required',
  });
};

module.exports = isSeller;
