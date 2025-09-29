const express = require('express');
const router = express.Router();
const { uploadDocument, getKnowledgeBase } = require('../controllers/ragController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', protect, uploadDocument);
router.get('/knowledge-base', protect, getKnowledgeBase);

module.exports = router;