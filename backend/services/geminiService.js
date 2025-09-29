const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing. Did you set it in your .env?");
}

// ✅ Use stable model names from /api/models
const GEMINI_MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.5-pro",
];

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Generate response from Gemini API
 */
const generateResponse = async (prompt, context = "") => {
  const fullPrompt = context
    ? `Context: ${context}\n\nUser Query: ${prompt}\n\nProvide an educational, helpful response:`
    : prompt;

  console.log(">>> Gemini prompt length:", fullPrompt.length);

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`>>> Trying model: ${model}`);
      const response = await axios.post(
        `${GEMINI_API_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const text =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Gemini";

      console.log(`>>> [Gemini] Model ${model} success`);
      return text;
    } catch (error) {
      console.error(
        `>>> [Gemini] Model ${model} failed:`,
        error.response?.data || error.message
      );
    }
  }

  throw new Error("All Gemini models failed");
};

/**
 * Very simple keyword-based sentiment analyzer
 */
const analyzeSentiment = (text) => {
  const positiveWords = ["good", "great", "excellent", "thank", "thanks", "helpful", "love", "amazing"];
  const negativeWords = ["bad", "poor", "terrible", "hate", "awful", "confused", "frustrated"];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

  let sentiment = "neutral";
  if (positiveCount > negativeCount) sentiment = "positive";
  if (negativeCount > positiveCount) sentiment = "negative";

  console.log(">>> [Sentiment] Detected:", sentiment);
  return sentiment;
};

module.exports = { generateResponse, analyzeSentiment };
