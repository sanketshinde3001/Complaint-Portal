const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors({
  origin: [
    'https://complaint-portal-pi.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Debug logger middleware
app.use((req, res, next) => {
  console.log(`API HIT: ${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes ---
const authRouter = require('./routes/authRoutes');
const complaintRouter = require('./routes/complaintRoutes'); // Handles multipart/form-data
const adminRouter = require('./routes/adminRoutes');

// Register complaint router BEFORE global JSON parsing
app.use('/api/v1/complaints', complaintRouter);

// Global JSON parser (for other routes)
app.use(express.json());

// Other route registrations
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

// Static file serving
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.send('College Complaint Portal API');
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  const multer = require('multer');
  console.error('Unhandled Error:', err.stack || err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: 'fail', message: `File upload error: ${err.message}` });
  } else if (err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ status: 'fail', message: err.message });
  }

  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong!',
  });
});

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

console.log('Attempting to start server...');
console.log('PORT:', PORT);
console.log('MONGO_URI:', MONGO_URI ? 'Found ✅' : 'Missing ❌');

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
