const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ admin: { id: admin.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/upload-image - Upload an image to Cloudinary (protected)
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ message: 'Admin access denied' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    const uploadStream = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'mezbaan' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await uploadStream(req.file.buffer);
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

// GET /api/admin/orders - Get all orders (protected)
router.get('/orders', auth, async (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ message: 'Admin access denied' });
  }

  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/bookings - Get all bookings (protected)
router.get('/bookings', auth, async (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ message: 'Admin access denied' });
  }

  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/admin/bookings/:id/cancel - Cancel a booking with a note (protected)
router.patch('/bookings/:id/cancel', auth, async (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ message: 'Admin access denied' });
  }

  try {
    const { cancellationNote } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancellationNote: cancellationNote || '' },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;