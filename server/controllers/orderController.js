const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

const TAX_RATE = 0.08; // 8%
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 9.99;

// @desc  Create order + Stripe checkout session
// @route POST /api/orders
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  // Validate products and build order items
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of items) {
    const product = await Product.findById(item.product).populate('seller', '_id');
    if (!product || !product.isActive) {
      return res.status(400).json({
        success: false,
        message: `Product ${item.product} not available`,
      });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}"`,
      });
    }
    const price = product.discountedPrice ?? product.price;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price,
      quantity: item.quantity,
      seller: product.seller._id,
    });
    itemsPrice += price * item.quantity;
  }

  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxPrice = parseFloat((itemsPrice * TAX_RATE).toFixed(2));
  const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  const order = await Order.create({
    buyer: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // Deduct stock
  await Promise.all(
    orderItems.map((oi) =>
      Product.findByIdAndUpdate(oi.product, {
        $inc: { stock: -oi.quantity, sold: oi.quantity },
      })
    )
  );

  if (paymentMethod === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItems.map((oi) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: oi.name, images: [oi.image] },
          unit_amount: Math.round(oi.price * 100),
        },
        quantity: oi.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/orders/${order._id}?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: { orderId: order._id.toString() },
    });

    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({ success: true, order, sessionUrl: session.url });
  }

  // COD
  order.status = 'processing';
  await order.save();

  // Notify sellers
  const uniqueSellers = [...new Set(orderItems.map((oi) => oi.seller.toString()))];
  await Promise.all(
    uniqueSellers.map((sellerId) =>
      Notification.create({
        user: sellerId,
        type: 'product_sold',
        title: 'New Order Received',
        message: `You have a new order #${order._id.toString().slice(-6).toUpperCase()}`,
        link: `/seller/orders`,
      })
    )
  );

  res.status(201).json({ success: true, order });
};

// @desc  Stripe webhook
// @route POST /api/orders/webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = await Order.findById(session.metadata.orderId);
    if (order) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'processing';
      order.paymentResult = {
        id: session.payment_intent,
        status: session.payment_status,
        updateTime: new Date().toISOString(),
        emailAddress: session.customer_details?.email,
      };
      await order.save();
    }
  }

  res.json({ received: true });
};

// @desc  Get my orders (buyer)
// @route GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images'),
    Order.countDocuments({ buyer: req.user._id }),
  ]);

  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
};

// @desc  Get single order
// @route GET /api/orders/:id
const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email')
    .populate('items.product', 'name images price');

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Owner or admin only
  if (
    order.buyer._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.json({ success: true, order });
};

// @desc  Update order status (seller / admin)
// @route PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { status, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();

  // Notify buyer
  await Notification.create({
    user: order.buyer,
    type: 'order_updated',
    title: 'Order Status Updated',
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status}`,
    link: `/orders/${order._id}`,
  });

  res.json({ success: true, order });
};

// @desc  Get seller orders
// @route GET /api/orders/seller-orders
const getSellerOrders = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ 'items.seller': req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name email'),
    Order.countDocuments({ 'items.seller': req.user._id }),
  ]);

  res.json({ success: true, orders, page, pages: Math.ceil(total / limit), total });
};

module.exports = { createOrder, stripeWebhook, getMyOrders, getOrder, updateOrderStatus, getSellerOrders };
