const Conversation = require('../models/Conversation');
const { generateResponse, analyzeSentiment } = require('../services/geminiService');
const { searchKnowledgeBase, buildContext } = require('../services/ragService');

// Send message and get AI response
const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?._id;

    console.log(">>> [sendMessage] Incoming request");
    console.log("   User:", userId);
    console.log("   Message:", message);

    if (!message || message.trim() === '') {
      console.warn(">>> [sendMessage] Empty message received");
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    let conversation;
    if (conversationId) {
      console.log(">>> [sendMessage] Fetching existing conversation:", conversationId);
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        console.warn(">>> [sendMessage] Conversation not found for ID:", conversationId);
        return res.status(404).json({ message: 'Conversation not found' });
      }
    } else {
      console.log(">>> [sendMessage] Creating new conversation");
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50),
        messages: [], // safer initialization
      });
    }

    const sentiment = analyzeSentiment(message);
    console.log(">>> [sendMessage] Sentiment analysis:", sentiment);

    conversation.messages.push({
      role: 'user',
      content: message,
      sentiment,
    });

    let relevantDocs = [];
    try {
      relevantDocs = await searchKnowledgeBase(message) || [];
      console.log(">>> [sendMessage] Relevant docs found:", relevantDocs.length);
    } catch (ragErr) {
      console.error(">>> [sendMessage] RAG search error:", ragErr.message);
    }

    let context = '';
    try {
      context = buildContext(relevantDocs);
      console.log(">>> [sendMessage] Built context length:", context.length);
    } catch (ctxErr) {
      console.error(">>> [sendMessage] Context build error:", ctxErr.message);
    }

    const recentMessages = conversation.messages.slice(-5);
    const conversationContext = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullContext = `${context}\n\nRecent Conversation:\n${conversationContext}`;
    console.log(">>> [sendMessage] Full context length:", fullContext.length);

    console.log(">>> [sendMessage] Sending to Gemini...");
    let botResponse = '';
    try {
      botResponse = await generateResponse(message, fullContext);
      console.log(">>> [sendMessage] Gemini replied:", botResponse?.substring(0, 100), '...');
    } catch (geminiErr) {
      console.error(">>> [sendMessage] Gemini error:", geminiErr.message);
      return res.status(500).json({ message: 'Gemini API failed', error: geminiErr.message });
    }

    conversation.messages.push({
      role: 'bot',
      content: botResponse,
      sentiment: 'neutral',
    });

    try {
      await conversation.save();
      console.log(">>> [sendMessage] Conversation saved with ID:", conversation._id);
    } catch (dbErr) {
      console.error(">>> [sendMessage] Mongo save error:", dbErr.message);
      return res.status(500).json({ message: 'Failed to save conversation', error: dbErr.message });
    }

    res.json({
      conversationId: conversation._id,
      message: {
        role: 'bot',
        content: botResponse,
        timestamp: new Date(),
      },
      usedRAG: relevantDocs.length > 0,
      sources: relevantDocs.length,
    });
  } catch (error) {
    console.error(">>> [sendMessage] Unexpected error:", error);
    res.status(500).json({ message: 'Failed to process message', error: error.message });
  }
};


// Get conversation history
const getConversations = async (req, res) => {
  try {
    console.log(">>> [getConversations] Fetching conversations for user:", req.user._id);
    const conversations = await Conversation.find({ userId: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    console.log(">>> [getConversations] Found conversations:", conversations.length);
    res.json(conversations);
  } catch (error) {
    console.error(">>> [getConversations] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get specific conversation
const getConversation = async (req, res) => {
  try {
    console.log(">>> [getConversation] Fetching conversation:", req.params.id);
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      console.warn(">>> [getConversation] Conversation not found:", req.params.id);
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error(">>> [getConversation] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete conversation
const deleteConversation = async (req, res) => {
  try {
    console.log(">>> [deleteConversation] Deleting conversation:", req.params.id);
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      console.warn(">>> [deleteConversation] Conversation not found:", req.params.id);
      return res.status(404).json({ message: 'Conversation not found' });
    }

    console.log(">>> [deleteConversation] Deleted conversation:", req.params.id);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error(">>> [deleteConversation] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
};
