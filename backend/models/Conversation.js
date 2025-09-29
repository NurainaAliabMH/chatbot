const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  messages: [messageSchema],
  context: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);