const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ragRoutes = require('./routes/ragRoutes');

// ✅ Load environment variables from backend/.env explicitly
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// ✅ Debug log: check if key is loaded (don’t print the key itself)
console.log('🔑 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Middleware
app.use(cors());
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

// ✅ Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EduChat AI Backend is running' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
