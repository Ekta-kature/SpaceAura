const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const sign = (id) => ({
  accessToken:  jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN  || '7d'  }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }),
});

// REGISTER
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { email, password, name, phone, city, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone, city, role: role === 'VENDOR' ? 'VENDOR' : 'CUSTOMER', isVerified: true },
      select: { id:true, email:true, name:true, role:true },
    });
    const tokens = sign(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
    res.status(201).json({ message: 'Account created!', user, ...tokens });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGIN
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    const tokens = sign(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
    res.json({ message: 'Login successful', user: { id:user.id, email:user.email, name:user.name, role:user.role, avatar:user.avatar }, ...tokens });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGOUT
router.post('/logout', protect, async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } }).catch(() => {});
  res.json({ message: 'Logged out.' });
});

// ME
router.get('/me', protect, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id:true, email:true, name:true, role:true, phone:true, city:true, avatar:true, createdAt:true,
      vendor: { select: { id:true, businessName:true, isVerified:true, rating:true } }
    },
  });
  res.json({ user });
});

// REFRESH
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required.' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ error: 'Invalid token.' });
    const tokens = sign(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
    res.json(tokens);
  } catch { res.status(401).json({ error: 'Expired or invalid refresh token.' }); }
});

// CHANGE PASSWORD
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(currentPassword, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Current password incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GOOGLE OAUTH ──────────────────────────────────────────────
// Step 1: Redirect user to Google
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Step 2: Google redirects back here — issue JWT and redirect to frontend
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed` })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_user`);
      const tokens = sign(user.id);
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
      // Redirect to frontend with tokens in URL — frontend will read them and store in localStorage
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`);
      redirectUrl.searchParams.set('token', tokens.accessToken);
      redirectUrl.searchParams.set('refresh', tokens.refreshToken);
      redirectUrl.searchParams.set('name', user.name);
      redirectUrl.searchParams.set('email', user.email);
      redirectUrl.searchParams.set('role', user.role);
      redirectUrl.searchParams.set('id', user.id);
      if (user.avatar) redirectUrl.searchParams.set('avatar', user.avatar);
      res.redirect(redirectUrl.toString());
    } catch (e) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

module.exports = router;
