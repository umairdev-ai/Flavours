const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  name: { type: String, default: '' },
  mobile: { type: String, required: true },
  table: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  baseAmount: { type: Number, default: 0 },
  surchargeAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'Pay at Restaurant' },
  paymentId: { type: String, default: '' },
  paymentStatus: { type: String, default: 'Pending' },
  status: { type: String, default: 'confirmed' },
  cancellationNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
