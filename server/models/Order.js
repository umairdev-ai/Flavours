const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);