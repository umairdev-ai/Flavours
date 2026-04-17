const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// In-memory OTP stores
const otpStore = new Map(); // For registration: email -> { otp, expiry, verified }
const forgotPasswordStore = new Map(); // For password reset: email -> { otp, expiry, verified }

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/send-otp - Send OTP to email for verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email is already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    otpStore.set(email, { otp, expiry, verified: false });

    await transporter.sendMail({
      from: `"Flavours Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Email Verification OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#b45309;margin-bottom:8px">Verify your email</h2>
          <p style="color:#555">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a1a1a;text-align:center;padding:24px 0">${otp}</div>
          <p style="color:#999;font-size:12px">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// POST /api/auth/verify-otp - Verify the OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
  if (new Date() > record.expiry) {
    otpStore.delete(email);
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

  record.verified = true;
  res.json({ message: 'Email verified successfully' });
});

// POST /api/auth/register - User registration (requires verified email)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const record = otpStore.get(email);
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Please verify your email before registering' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    otpStore.delete(email);

    const token = jwt.sign({ user: { id: user.id, email: user.email } }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user: { id: user.id, email: user.email } }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/forgot-password - Send OTP to registered email for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if email is registered
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email is not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    forgotPasswordStore.set(email, { otp, expiry, verified: false });

    await transporter.sendMail({
      from: `"Flavours Restaurant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#b45309;margin-bottom:8px">Reset your password</h2>
          <p style="color:#555">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a1a1a;text-align:center;padding:24px 0">${otp}</div>
          <p style="color:#999;font-size:12px">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent to your registered email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// POST /api/auth/verify-forgot-otp - Verify OTP for password reset
router.post('/verify-forgot-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const record = forgotPasswordStore.get(email);
  if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
  if (new Date() > record.expiry) {
    forgotPasswordStore.delete(email);
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

  record.verified = true;
  res.json({ message: 'OTP verified successfully' });
});

// POST /api/auth/reset-password - Reset password with verified OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const record = forgotPasswordStore.get(email);
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Please verify your OTP first' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    forgotPasswordStore.delete(email);

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
