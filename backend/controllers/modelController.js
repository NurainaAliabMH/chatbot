const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ✅ List available Gemini models
const listModels = async (req, res) => {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error(">>> [listModels] Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to fetch models",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { listModels };
