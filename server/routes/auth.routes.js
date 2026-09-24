// routes/auth.routes.js
// Authentication route definitions

const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, logout, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register — Create new user account
router.post('/register', register);

// POST /api/auth/login — Authenticate and receive JWT
router.post('/login', login);

// Cookie-backed session helpers
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.post('/logout', logout);

module.exports = router;
