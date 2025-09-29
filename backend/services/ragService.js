const KnowledgeBase = require('../models/KnowledgeBase');

// Search knowledge base for relevant context
const searchKnowledgeBase = async (query, limit = 3) => {
  try {
    // Text search in MongoDB
    const results = await KnowledgeBase.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    if (results.length === 0) {
      // Fallback: keyword matching
      const keywords = query.toLowerCase().split(' ');
      const fallbackResults = await KnowledgeBase.find({
        keywords: { $in: keywords }
      }).limit(limit);
      
      return fallbackResults;
    }

    return results;
  } catch (error) {
    console.error('RAG Search Error:', error);
    return [];
  }
};

// Build context from retrieved documents
const buildContext = (documents) => {
  if (!documents || documents.length === 0) {
    return '';
  }

  return documents
    .map((doc, index) => {
      return `[Source ${index + 1}]\nCategory: ${doc.category}\n${doc.question ? `Q: ${doc.question}\n` : ''}Content: ${doc.content}\n`;
    })
    .join('\n---\n');
};

// Add document to knowledge base
const addToKnowledgeBase = async (documentData) => {
  try {
    const keywords = extractKeywords(documentData.content);
    const document = await KnowledgeBase.create({
      ...documentData,
      keywords,
    });
    return document;
  } catch (error) {
    console.error('Add to KB Error:', error);
    throw error;
  }
};

// Simple keyword extraction
const extractKeywords = (text) => {
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but'];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return [...new Set(words.filter(word => word.length > 3 && !stopWords.includes(word)))].slice(0, 20);
};

module.exports = {
  searchKnowledgeBase,
  buildContext,
  addToKnowledgeBase,
  extractKeywords,
};