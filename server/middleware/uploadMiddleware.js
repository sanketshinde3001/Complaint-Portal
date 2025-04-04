const multer = require('multer');
const cloudinary = require('../config/cloudinary'); // Import configured Cloudinary instance
const streamifier = require('streamifier');

// Use memory storage to get file buffer
const storage = multer.memoryStorage();

// File filter remains the same
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    // Use Multer's error format
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type. Only JPG, PNG, GIF, MP4, MPEG, MOV allowed.'), false);
  }
};

// Configure Multer with memory storage and limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 20 // Limit file size (e.g., 20MB)
  },
  fileFilter: fileFilter
});

// Middleware to upload files to Cloudinary after Multer processing
const uploadToCloudinary = (req, res, next) => {
  console.log('[Upload Middleware] Starting Cloudinary upload process...'); // Added log

  // Check if files were uploaded by Multer
  if (!req.files || req.files.length === 0) {
    console.log('[Upload Middleware] No files found in req.files. Skipping Cloudinary upload.'); // Added log
    return next(); // No files to upload, proceed to next middleware/controller
  }

  console.log(`[Upload Middleware] Received ${req.files.length} file(s) to upload.`); // Added log

  const uploadPromises = req.files.map(file => {
    console.log(`[Upload Middleware] Preparing to upload file: ${file.originalname}`); // Added log
    return new Promise((resolve, reject) => {
      // Use streamifier to pipe the buffer to Cloudinary's uploader
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'complaint_media', // Optional: Organize uploads in a specific folder
          resource_type: 'auto' // Automatically detect image or video
        },
        (error, result) => {
          if (error) {
            console.error(`[Upload Middleware] Cloudinary Upload Error for ${file.originalname}:`, error); // Enhanced log
            return reject(new Error(`Failed to upload ${file.originalname} to Cloudinary.`));
          }
          if (!result) {
             console.error(`[Upload Middleware] Cloudinary did not return a result for ${file.originalname}.`); // Added log
            return reject(new Error(`Cloudinary did not return a result for ${file.originalname}.`));
          }
          console.log(`[Upload Middleware] Successfully uploaded ${file.originalname}. URL: ${result.secure_url}`); // Added log
          resolve(result.secure_url); // Resolve with the secure URL of the uploaded file
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  });

  Promise.all(uploadPromises)
    .then(urls => {
      console.log('[Upload Middleware] All files uploaded successfully. URLs:', urls); // Added log
      // Attach the array of Cloudinary URLs to the request body
      req.body.mediaUrls = urls;
      // Remove files from request object as they are now handled
      req.files = undefined; // Keep this line
      console.log('[Upload Middleware] Attached mediaUrls to req.body and proceeding to next middleware/controller.'); // Added log
      next(); // Proceed to the controller
    })
    .catch(err => {
      console.error('[Upload Middleware] Error during Promise.all execution:', err); // Enhanced log
      // Pass a specific error to the error handling middleware
      next(new Error('One or more files failed to upload to Cloudinary.')); // More specific error
    });
};

// Export both the Multer middleware and the Cloudinary upload middleware
// Usage in route: router.post('/submit', upload.array('media', 5), uploadToCloudinary, complaintController.submitComplaint);
module.exports = {
  handleUpload: upload, // Multer middleware for parsing form-data and handling files in memory
  uploadToCloudinary: uploadToCloudinary // Middleware to upload buffered files to Cloudinary
};
