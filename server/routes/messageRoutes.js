const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  sendMessage,
  getConversation,
  getInbox,
} = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/', protect, getInbox);
router.get('/:userId', protect, getConversation);

module.exports = router;
