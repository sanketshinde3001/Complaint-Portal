const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // Ensure env vars are loaded

// Helper function to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '90d', // Example: token expires in 90 days
  });
};

// Helper function to create and send JWT via cookie (optional, can also send in response body)
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// --- Controller Functions ---

exports.signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, gender } = req.body;

    // Basic validation
    if (!name || !email || !password || !passwordConfirm || !gender) {
      return res.status(400).json({ status: 'fail', message: 'Please provide all required fields.' });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    // Create new user
    const newUser = new User({ name, email, password, gender });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken; // Store raw token
    newUser.verificationTokenExpires = Date.now() + 10 * 60 * 1000;
    

    // Save user to DB before sending email
    await newUser.save();

    // Send verification email
    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const message = `Welcome to the College Complaint Portal!\n\nPlease verify your email address by clicking the link below:\n\n${verificationURL}\n\nThis link expires in 10 minutes.`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Verify Your Email Address',
        message,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account.',
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Cleanup verification tokens in case email sending fails
      newUser.verificationToken = undefined;
      newUser.verificationTokenExpires = undefined;
      await newUser.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        status: 'error', 
        message: 'Signup successful, but email verification failed. Please try again or contact support.' 
      });
    }
  } catch (err) {
    console.error('Signup Error:', err);

    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Email address already in use.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(el => el.message);
      return res.status(400).json({ status: 'fail', message: `Invalid input data. ${messages.join('. ')}` });
    }

    return res.status(500).json({ status: 'error', message: 'An error occurred during registration.' });
  }
};

// Resend Verification Email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Avoid revealing if an email exists or not for security
      return res.status(200).json({ status: 'success', message: 'If an account with that email exists, a new verification link has been sent.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ status: 'fail', message: 'This account is already verified.' });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 10 * 60 * 1000; // New 10-minute expiry

    await user.save();

    // Send the new verification email
    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const message = `You requested a new email verification link.\n\nPlease verify your email address by clicking the link below:\n\n${verificationURL}\n\nThis link expires in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Resend: Verify Your Email Address',
        message,
      });

      return res.status(200).json({
        status: 'success',
        message: 'A new verification link has been sent to your email address.',
      });
    } catch (emailError) {
      console.error('Resend Email sending error:', emailError);
      // Don't revert token changes here, as the user might try again
      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending the verification email. Please try again later.',
      });
    }
  } catch (err) {
    console.error('Resend Verification Error:', err);
    res.status(500).json({ status: 'error', message: 'An error occurred while resending the verification email.' });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log(token);

    if (!token) {
      return res.status(400).json({ status: 'fail', message: 'Invalid verification request.' });
    }

    // 2) Find the user with a valid token
    const user = await User.findOne({
      verificationToken: req.params.token, // Compare with raw token
      verificationTokenExpires: { $gt: Date.now() }, // Token must not be expired
    });    

    console.log(user)

    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired.' });
    }

    // 3) Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(user);
    

    // 4) Log the user in (optional, improves UX)
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Email Verification Error:', err);
    res.status(500).json({ status: 'error', message: 'An error occurred during email verification.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
    }

    // 1) Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }

    // 2) Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ status: 'fail', message: 'Please verify your email before logging in.' });
    }

    // 3) Everything is fine, send JWT token
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ status: 'error', message: 'An error occurred during login.' });
  }
};
