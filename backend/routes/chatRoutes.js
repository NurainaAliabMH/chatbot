const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/message', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);

module.exports = router;