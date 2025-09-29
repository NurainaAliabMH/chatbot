const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { addToKnowledgeBase } = require('../services/ragService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /txt|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .txt, .pdf, .doc files are allowed'));
  },
}).single('file');

// Upload and process document
const uploadDocument = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Read file content (simplified - for .txt files)
      const filePath = req.file.path;
      let content = '';

      if (path.extname(req.file.originalname) === '.txt') {
        content = await fs.readFile(filePath, 'utf-8');
      } else {
        content = `Document uploaded: ${req.file.originalname}. Content extraction not implemented for this file type.`;
      }

      // Add to knowledge base
      const document = await addToKnowledgeBase({
        category: 'Uploaded',
        content: content.substring(0, 5000), // Limit content length
        metadata: {
          source: req.file.originalname,
          uploadedBy: req.user._id,
        },
      });

      res.json({
        message: 'File uploaded and processed successfully',
        document: {
          id: document._id,
          filename: req.file.originalname,
          category: document.category,
        },
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all knowledge base entries
const getKnowledgeBase = async (req, res) => {
  try {
    const documents = await KnowledgeBase.find()
      .select('category question metadata createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getKnowledgeBase };