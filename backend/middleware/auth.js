// middleware/auth.js — JWT authentication
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Verify JWT token — attached as Bearer in Authorization header
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id:true, email:true, name:true, role:true, isVerified:true },
    });
    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired. Please login again.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Optional — doesn't fail if no token, just sets req.user = null
const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id:true, email:true, name:true, role:true },
      });
      req.user = user;
    }
  } catch {}
  next();
};

// Role guards
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
  }
  next();
};

const isAdmin  = requireRole('ADMIN');
const isVendor = requireRole('VENDOR', 'ADMIN');

module.exports = { protect, optionalAuth, requireRole, isAdmin, isVendor };
