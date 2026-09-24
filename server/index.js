// index.js
// Main entry point for the Express server

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Connect to MongoDB
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Permit cookie-authenticated requests only from the configured client.
app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// CSRF defence for cookie-authenticated state-changing browser requests.
app.use((req, res, next) => {
  const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (unsafeMethod && req.headers.origin !== clientOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// Authentication routes (register, login)
app.use('/api/auth', require('./routes/auth.routes'));

// Item routes (lost & found items CRUD)
app.use('/api/items', require('./routes/item.routes'));

// Claim routes (claiming found items)
app.use('/api/claims', require('./routes/claim.routes'));

// Community information about lost-item reports
app.use('/api/insights', require('./routes/insight.routes'));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: '🎒 Lost & Found API is running!' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
