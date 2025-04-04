const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // Load env vars from root .env

const sendEmail = async (options) => {
  // 1) Create a transporter
  // Note: For production, use a dedicated email service like SendGrid, Mailgun, etc.
  // Gmail is suitable for development/testing but has limitations.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // For Gmail, you might need to enable "less secure app access" or use App Passwords
    // Consider using services like Mailtrap for development to avoid sending real emails
  });

  // 2) Define the email options
  const mailOptions = {
    from: `College Complaint Portal <${process.env.EMAIL_USER}>`, // Sender address
    to: options.email, // List of receivers
    subject: options.subject, // Subject line
    text: options.message, // Plain text body
    // html: options.html // You can also send HTML content
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error(`Error sending email to ${options.email}:`, error);
    // Handle error appropriately - maybe throw it to be caught by the calling function
    throw new Error('There was an error sending the email. Please try again later.');
  }
};

module.exports = sendEmail;
