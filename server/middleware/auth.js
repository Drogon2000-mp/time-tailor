import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Ensure User is imported

// Generate JWT token for a user.
// Payload supports: {_id, role, email, name}
export const generateToken = (payload) => {
  const jwtPayload = {
    _id: payload?._id,
    role: payload?.role,
    email: payload?.email,
    name: payload?.name,
  };

  return jwt.sign(jwtPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const extractToken = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  return token;
};

// Authenticate middleware: checks cookie token first, then Authorization header
export const authenticate = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // DEBUG LOGS
    console.log("--- AUTH DEBUG ---");
    console.log("TOKEN EXTRACTED:", token ? "Yes" : "No");
    console.log("DECODED PAYLOAD:", decoded);

    // Handle Virtual Admin vs Database User
    if (decoded._id === 'admin') {
      req.user = {
        _id: 'admin',
        role: 'admin',
        email: 'admin@gmail.com',
        name: 'Admin'
      };
    } else {
      const user = await User.findById(decoded._id);
      if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
      req.user = user;
    }

    console.log("REQ.USER SET:", req.user?._id);
    console.log("ROLE DETECTED:", req.user?.role);
    
    return next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
};

// Backwards-compatible alias for older imports
export const protect = authenticate;

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Permission denied' });
  }
  next();
};
