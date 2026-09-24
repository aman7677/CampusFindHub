// middleware/auth.middleware.js
// JWT authentication middleware — protects routes requiring a logged-in user

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Prefer the HttpOnly session cookie. Bearer tokens remain supported for API clients.
  const authHeader = req.headers.authorization;
  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('campusfindhub_session='))
    ?.slice('campusfindhub_session='.length);
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  try {
    // Verify token with the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user payload to request for downstream controllers
    req.user = decoded;

    console.log(`🔐 Authenticated user: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

module.exports = { protect };
