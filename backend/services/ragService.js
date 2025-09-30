// backend/services/ragService.js
const KnowledgeBase = require('../models/KnowledgeBase');

// Search knowledge base for relevant context
const searchKnowledgeBase = async (query, limit = 3) => {
  try {
    // First try MongoDB full-text search
    let results = await KnowledgeBase.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    // 🔍 Fallback: regex search on content + metadata.source
    if (!results.length) {
      results = await KnowledgeBase.find({
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { 'metadata.source': { $regex: query, $options: 'i' } },
        ],
      }).limit(limit);
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
      return `[Source ${index + 1}]\nCategory: ${doc.category}\n${
        doc.question ? `Q: ${doc.question}\n` : ''
      }Content: ${doc.content}\n`;
    })
    .join('\n---\n');
};

// Add document to knowledge base
const addToKnowledgeBase = async (documentData) => {
  try {
    let keywords = extractKeywords(documentData.content);

    // ✅ Auto-inject "resume" if filename suggests it
    if (documentData.metadata?.source?.toLowerCase().includes('resume')) {
      keywords.push('resume');
    }

    const document = await KnowledgeBase.create({
      ...documentData,
      keywords: [...new Set(keywords)], // ensure uniqueness
    });
    return document;
  } catch (error) {
    console.error('Add to KB Error:', error);
    throw error;
  }
};

// Simple keyword extraction
const extractKeywords = (text) => {
  const stopWords = [
    'the',
    'is',
    'at',
    'which',
    'on',
    'a',
    'an',
    'and',
    'or',
    'but',
  ];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return [...new Set(words.filter((word) => word.length > 3 && !stopWords.includes(word)))].slice(
    0,
    20
  );
};

module.exports = {
  searchKnowledgeBase,
  buildContext,
  addToKnowledgeBase,
  extractKeywords,
};
