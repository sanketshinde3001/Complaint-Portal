const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// --- Routes --- (Define Routers First)
const authRouter = require('./routes/authRoutes');
const complaintRouter = require('./routes/complaintRoutes'); // Handles multipart/form-data
const adminRouter = require('./routes/adminRoutes');

// Middleware
app.use(cors({
  origin: [
    'https://complaint-portal-pi.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

// --- Route Registration ---
// Register complaint router BEFORE global JSON parsing
app.use('/api/v1/complaints', complaintRouter);

// Now apply global JSON parsing for other routes
app.use(express.json()); // Parse JSON request bodies

// Register other routes that expect JSON
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

// Static file serving (can be here or earlier)
app.use('/uploads', express.static('uploads'));

// Basic route (can be anywhere before error handler)
app.get('/', (req, res) => {
  res.send('College Complaint Portal API');
});

// Global Error Handling Middleware (should be LAST)
app.use((err, req, res, next) => {
  // Need to import Multer here to check for MulterError instance
  const multer = require('multer');
  console.error('Unhandled Error:', err.stack || err); // Log stack trace for better debugging
  // Handle specific errors like Multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: 'fail', message: `File upload error: ${err.message}` });
  } else if (err.message.startsWith('Invalid file type')) {
     return res.status(400).json({ status: 'fail', message: err.message });
  }
  // Generic error response
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong!',
    // Optionally include stack trace in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});


// Database connection
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
