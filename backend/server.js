const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ragRoutes = require('./routes/ragRoutes');
const modelRoutes = require("./routes/modelRoutes");

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('🔑 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');

connectDB();

const app = express();

// ✅ Load allowed origins
const origins = (process.env.CLIENT_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
console.log('✅ Allowed origins:', origins);

// ✅ CORS (must be first)
app.use(cors({
  origin: (origin, cb) => {
    console.log("🌐 Incoming request origin:", origin);
    if (!origin || origins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

// ✅ JSON & URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Create uploads folder if it doesn’t exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rag', ragRoutes);
app.use("/api/models", modelRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EduChat AI Backend is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
