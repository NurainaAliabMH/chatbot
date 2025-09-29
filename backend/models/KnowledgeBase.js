const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['FAQ', 'Course Material', 'Assignment', 'General', 'Uploaded'],
  },
  question: String,
  content: {
    type: String,
    required: true,
  },
  keywords: [String],
  metadata: {
    subject: String,
    difficulty: String,
    source: String,
  },
  embedding: [Number], // For advanced RAG (optional)
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Text index for search
knowledgeBaseSchema.index({ question: 'text', content: 'text', keywords: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);