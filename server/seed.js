const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash('admin123', 10); // Change password as needed
  const admin = new Admin({ username: 'admin', password: hashedPassword });
  await admin.save();
  console.log('Admin user created');
  process.exit();
};

seedAdmin();