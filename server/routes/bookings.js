const express = require('express');
const Booking = require('../models/Booking');

const router = express.Router();

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date, time, guests } = req.body;
    const newBooking = new Booking({ name, email, phone, date, time, guests });
    await newBooking.save();
    res.status(201).json({ message: 'Table booked successfully', booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;