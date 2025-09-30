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
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
    } else {
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50),
      });
    }

    const sentiment = analyzeSentiment(message);

    conversation.messages.push({
      role: 'user',
      content: message,
      sentiment,
    });

    // 🔍 Search KB
    const relevantDocs = await searchKnowledgeBase(message) || [];
    console.log(">>> Relevant docs found:", relevantDocs.length);

    if (relevantDocs.length === 0) {
      // ❌ No context, refuse politely
      const fallback = "⚠️ Sorry, I can only answer questions related to the uploaded documents.";
      conversation.messages.push({
        role: 'bot',
        content: fallback,
        sentiment: 'neutral',
      });
      await conversation.save();

      return res.json({
        conversationId: conversation._id,
        message: {
          role: 'bot',
          content: fallback,
          timestamp: new Date(),
        },
        usedRAG: false,
        sources: 0,
      });
    }

    // ✅ Build context when docs exist
    const context = buildContext(relevantDocs);
    const recentMessages = conversation.messages.slice(-5);
    const conversationContext = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const fullContext = `${context}\n\nRecent Conversation:\n${conversationContext}`;

    console.log(">>> [sendMessage] Sending to Gemini...");
    const botResponse = await generateResponse(message, fullContext);

    conversation.messages.push({
      role: 'bot',
      content: botResponse,
      sentiment: 'neutral',
    });

    await conversation.save();

    res.json({
      conversationId: conversation._id,
      message: {
        role: 'bot',
        content: botResponse,
        timestamp: new Date(),
      },
      usedRAG: true,
      sources: relevantDocs.length,
    });
  } catch (error) {
    console.error(">>> [sendMessage] Error:", error);
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
