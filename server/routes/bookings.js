const express = require('express');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings/my-bookings - Get current user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Only logged in guests can view bookings' });
    }

    const bookings = await Booking.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/bookings/:id - Cancel a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Only logged in guests can cancel bookings' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user || req.admin) {
      return res.status(403).json({ message: 'Only logged in guests can book a table' });
    }

    const { date, time, guests, table, mobile } = req.body;
    if (!date || !time || !guests || !table || !mobile) {
      return res.status(400).json({ message: 'Date, time, guests, table selection and mobile number are required' });
    }

    // Check if user already has a booking for this table at this time
    const existingBooking = await Booking.findOne({ userId: req.user.id, date, time, table });
    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this table at this time.' });
    }

    const newBooking = new Booking({
      userId: req.user.id,
      userEmail: req.user.email,
      mobile,
      table,
      date,
      time,
      guests
    });
    await newBooking.save();
    res.status(201).json({ message: 'Table booked successfully', booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;