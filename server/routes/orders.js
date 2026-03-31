const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const { userName, email, phone, items, total } = req.body;
    const newOrder = new Order({ userName, email, phone, items, total });
    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;