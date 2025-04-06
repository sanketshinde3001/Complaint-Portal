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

// Helper function to create and send JWT via HTTP-Only cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000 // Expires in 90 days (match token expiry)
    ),
    httpOnly: true, // Cannot be accessed or modified by the browser JavaScript
    secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
    // sameSite: 'strict' // Consider adding for CSRF protection if applicable
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output before sending user data
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    // No longer sending token in the body
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

// Get current user based on cookie/token
exports.getMe = (req, res, next) => {
  // The 'protect' middleware already attached the user to req.user
  // We just need to send it back
  if (!req.user) {
     return res.status(401).json({ status: 'fail', message: 'User not found or not logged in.' });
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

// Logout user by clearing the cookie
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// --- Forgot/Reset Password ---

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Send generic success message even if user not found for security
      return res.status(200).json({ status: 'success', message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // 2) Generate the random reset token (different from verification token)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store the hashed token in the DB for security (optional but recommended)
    // user.passwordResetToken = crypto
    //   .createHash('sha256')
    //   .update(resetToken)
    //   .digest('hex');
    // For simplicity now, store raw token (less secure if DB is compromised)
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

    await user.save({ validateBeforeSave: false }); // Save changes, skip validation if needed

    // 3) Send token back to user's email
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!\nThis link expires in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset Token (valid for 10 min)',
        message
      });

      res.status(200).json({
        status: 'success',
        message: 'Password reset token sent to email!'
      });
    } catch (err) {
      console.error('Password Reset Email Error:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false }); // Clear tokens on email failure
      return res.status(500).json({ status: 'error', message: 'There was an error sending the email. Try again later!' });
    }
  } catch (err) {
     console.error('Forgot Password Error:', err);
     res.status(500).json({ status: 'error', message: 'An error occurred.' });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const resetToken = req.params.token;
    // If storing hashed token:
    // const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    // If storing raw token:
    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() } // Check expiry
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired.' });
    }

    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
         return res.status(400).json({ status: 'fail', message: 'Please provide password and password confirmation.' });
    }
     if (password !== passwordConfirm) {
      return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.passwordResetToken = undefined; // Clear reset fields
    user.passwordResetExpires = undefined;
    // Optional: Add passwordChangedAt field and update it here for security checks in protect middleware
    // user.passwordChangedAt = Date.now() - 1000; // Set slightly in past

    await user.save(); // This triggers the pre-save hook for hashing

    // 3) Log the user in, send JWT
    createSendToken(user, 200, res);

  } catch (err) {
    console.error('Reset Password Error:', err);
     if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({ status: 'fail', message: `Invalid input data. ${messages.join('. ')}` });
    }
    res.status(500).json({ status: 'error', message: 'An error occurred while resetting the password.' });
  }
};
