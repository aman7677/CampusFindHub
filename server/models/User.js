// models/User.js
// Mongoose schema for campus users (students, staff, admin)

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Full name of the user
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  // Unique campus email address
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Bcrypt-hashed password (never store plain text)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },

  // Campus role determines permissions
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
  },

  // Timestamp of account creation
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
