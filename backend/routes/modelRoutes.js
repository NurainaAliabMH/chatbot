const express = require("express");
const router = express.Router();
const { listModels } = require("../controllers/modelController");
const { protect } = require("../middleware/authMiddleware");

// ✅ You can protect it if you want, or leave open
router.get("/", protect, listModels);

module.exports = router;
