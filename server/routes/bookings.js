const express = require('express');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

const RUSH_BOOKING_SURCHARGE_RATE = 0.2;

const getBookingLeadDays = (bookingDate) => {
  const today = new Date();
  const booking = new Date(`${bookingDate}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((booking.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
};

const calculateBookingAmounts = (date, items = []) => {
  const baseAmount = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  const leadDays = getBookingLeadDays(date);
  const rushEligible = leadDays === 0 || leadDays === 1;
  const surchargeAmount = rushEligible ? Math.round(baseAmount * RUSH_BOOKING_SURCHARGE_RATE) : 0;
  return {
    baseAmount,
    surchargeAmount,
    totalAmount: baseAmount + surchargeAmount,
  };
};

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

// PATCH /api/bookings/:id/pay - Update payment status for an existing booking
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Only logged in guests can update payments' });
    }

    const { paymentMethod, paymentId, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    booking.paymentMethod = paymentMethod;
    booking.paymentId = paymentId || booking.paymentId;
    booking.paymentStatus = paymentStatus;

    await booking.save();
    res.json({ message: 'Payment updated successfully', booking });
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

    // 48-hour rule check
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const diffInHours = (bookingDateTime - now) / (1000 * 60 * 60);

    if (diffInHours < 48) {
      return res.status(400).json({ message: 'Reservations can only be cancelled at least 48 hours in advance.' });
    }

    booking.status = 'cancelled';
    booking.cancellationNote = 'Cancelled by guest';
    await booking.save();
    
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

    const { date, time, guests, table, mobile, name, items, paymentMethod, paymentId, paymentStatus } = req.body;
    if (!date || !time || !guests || !table || !mobile) {
      return res.status(400).json({ message: 'Date, time, guests, table selection and mobile number are required' });
    }

    // Check if user already has a booking for this table at this time
    const existingBooking = await Booking.findOne({ userId: req.user.id, date, time, table });
    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this table at this time.' });
    }

    const normalizedItems = Array.isArray(items) ? items : [];
    const { baseAmount, surchargeAmount, totalAmount } = calculateBookingAmounts(date, normalizedItems);

    const newBooking = new Booking({
      userId: req.user.id,
      userEmail: req.user.email,
      name: name || req.user.name,
      mobile,
      table,
      date,
      time,
      guests,
      items: normalizedItems,
      baseAmount,
      surchargeAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'Pay at Restaurant',
      paymentId: paymentId || '',
      paymentStatus: paymentStatus || 'Pending'
    });
    await newBooking.save();
    res.status(201).json({ message: 'Table booked successfully', booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
