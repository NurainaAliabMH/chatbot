const Conversation = require('../models/Conversation');
const { generateResponse, analyzeSentiment } = require('../services/geminiService');
const { searchKnowledgeBase, buildContext } = require('../services/ragService');

// Send message and get AI response
const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?._id;

    console.log(">>> Incoming sendMessage");
    console.log("User:", userId);
    console.log("Message:", message);

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

    const relevantDocs = await searchKnowledgeBase(message) || [];
    console.log(">>> Relevant docs found:", relevantDocs.length);

    const context = buildContext(relevantDocs);

    const recentMessages = conversation.messages.slice(-5);
    const conversationContext = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullContext = `${context}\n\nRecent Conversation:\n${conversationContext}`;

    console.log(">>> Sending to Gemini...");
    const botResponse = await generateResponse(message, fullContext);
    console.log(">>> Gemini replied:", botResponse);

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
      usedRAG: relevantDocs.length > 0,
      sources: relevantDocs.length,
    });
  } catch (error) {
    console.error(">>> SendMessage error:", error);
    res.status(500).json({ message: 'Failed to process message', error: error.message });
  }
};


// Get conversation history
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific conversation
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete conversation
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
};