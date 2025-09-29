const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing. Did you set it in your .env?');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Gemini model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Generate AI response
const generateResponse = async (prompt, context = '') => {
  try {
    const fullPrompt = context
      ? `Context: ${context}\n\nUser Query: ${prompt}\n\nProvide an educational, helpful response:`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    return result.response.text();

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};

// Analyze sentiment
const analyzeSentiment = (text) => {
  const positiveWords = ['good', 'great', 'excellent', 'thank', 'thanks', 'helpful', 'love', 'amazing'];
  const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'awful', 'confused', 'frustrated'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

module.exports = { generateResponse, analyzeSentiment };
