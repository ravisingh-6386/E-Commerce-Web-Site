const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Deterministic room ID from two user IDs
const getRoomId = (a, b) => [a.toString(), b.toString()].sort().join('_');

// @desc  Send a message
// @route POST /api/messages
const sendMessage = async (req, res) => {
  const { receiverId, content, productId } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ success: false, message: 'receiverId and content required' });
  }

  const roomId = getRoomId(req.user._id, receiverId);

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    content,
    product: productId || null,
    roomId,
  });

  await message.populate('sender', 'name avatar');

  // Emit via Socket.IO
  const io = req.app.get('io');
  io.to(roomId).emit('receive_message', message);

  // Create notification for receiver
  await Notification.create({
    user: receiverId,
    type: 'new_message',
    title: 'New Message',
    message: `${req.user.name} sent you a message`,
    link: `/messages/${req.user._id}`,
  });

  res.status(201).json({ success: true, message });
};

// @desc  Get conversation with a user
// @route GET /api/messages/:userId
const getConversation = async (req, res) => {
  const roomId = getRoomId(req.user._id, req.params.userId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 30;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ roomId }),
  ]);

  // Mark messages as read
  await Message.updateMany(
    { roomId, receiver: req.user._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    messages: messages.reverse(),
    page,
    pages: Math.ceil(total / limit),
  });
};

// @desc  Get all conversations (inbox)
// @route GET /api/messages
const getInbox = async (req, res) => {
  const userId = req.user._id.toString();

  // Get the latest message per room
  const latestMessages = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$roomId',
        lastMessage: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$lastMessage' } },
    { $sort: { createdAt: -1 } },
    { $limit: 20 },
  ]);

  await Message.populate(latestMessages, { path: 'sender receiver', select: 'name avatar' });

  // Unread count
  const unread = await Message.countDocuments({ receiver: req.user._id, read: false });

  res.json({ success: true, messages: latestMessages, unread });
};

module.exports = { sendMessage, getConversation, getInbox };
