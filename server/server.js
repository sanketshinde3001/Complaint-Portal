const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
// Removed mongoSanitize import as it causes errors
const rateLimit = require('express-rate-limit'); // Import rate-limit

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

// --- Security Middleware ---
// Set security HTTP headers
app.use(helmet());

// Removed mongoSanitize middleware usage
// app.use(mongoSanitize());

// --- Rate Limiting ---
// Apply to all requests starting with /api/v1/
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    // Optional: skip successful OPTIONS requests (useful for CORS preflight)
    // skipSuccessfulRequests: true,
});
app.use('/api/v1', apiLimiter); // Apply the limiter to all API routes


// Apply global JSON parser BEFORE routes that need it
// Increase payload size limit (e.g., 10kb for JSON, adjust as needed)
app.use(express.json({ limit: '10kb' }));


// --- Routes ---
const authRouter = require('./routes/authRoutes');
const complaintRouter = require('./routes/complaintRoutes'); // Handles both multipart and JSON (nested)
const petitionRouter = require('./routes/petitionRoutes'); // Import petition router
const adminRouter = require('./routes/adminRoutes'); // Handles admin-specific petition routes too

// Register routers
app.use('/api/v1/complaints', complaintRouter); // Multer within this router handles multipart for specific routes
app.use('/api/v1/petitions', petitionRouter); // Mount petition routes
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
