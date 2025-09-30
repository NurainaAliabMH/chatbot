const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { addToKnowledgeBase } = require("../services/ragService");
const KnowledgeBase = require("../models/KnowledgeBase");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
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
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only .txt, .pdf, .doc, .docx files are allowed"));
  },
}).single("file");

// Upload and process document
const uploadDocument = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let content = "";

      try {
        if (ext === ".txt") {
          content = await fs.readFile(filePath, "utf-8");
        } else if (ext === ".pdf") {
          const dataBuffer = await fs.readFile(filePath);
          const pdfData = await pdfParse(dataBuffer);
          content = pdfData.text;
        } else if (ext === ".docx") {
          const docxBuffer = await fs.readFile(filePath);
          const result = await mammoth.extractRawText({ buffer: docxBuffer });
          content = result.value;
        } else {
          content = `⚠️ Content extraction not implemented for ${req.file.originalname}`;
        }
      } catch (extractionError) {
        console.error("❌ Error extracting file content:", extractionError);
        content = `⚠️ Failed to extract content from ${req.file.originalname}`;
      }

      // Add to knowledge base
      const document = await addToKnowledgeBase({
        category: "Uploaded",
        content: content.substring(0, 5000), // cap to avoid overload
        metadata: {
          source: req.file.originalname,
          uploadedBy: req.user._id,
        },
      });

      res.json({
        message: "File uploaded and processed successfully",
        document: {
          id: document._id,
          filename: req.file.originalname,
          category: document.category,
        },
      });
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all knowledge base entries
const getKnowledgeBase = async (req, res) => {
  try {
    const documents = await KnowledgeBase.find()
      .select("category question content metadata createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(documents);
  } catch (error) {
    console.error("❌ Get KB error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getKnowledgeBase };
