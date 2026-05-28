require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const passport  = require('passport');
const { Server } = require('socket.io');

require('./config/passport');

const app    = express();
const server = http.createServer(app);

// ── ALLOWED ORIGINS ──────────────────────────────────────────
const ORIGINS = [
  'http://localhost:5173',  // Vite React dev server
  'http://127.0.0.1:5173',
  'http://localhost:5500',  // Live Server (legacy HTML)
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── SOCKET.IO ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ORIGINS, methods: ['GET','POST'], credentials: true },
});
require('./socket/socketHandler')(io);

// ── CORE MIDDLEWARE ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ORIGINS, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 50, standardHeaders: true, legacyHeaders: false }));

// Attach io to req
app.use((req, _res, next) => { req.io = io; next(); });

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart',       require('./routes/cart'));
app.use('/api/wishlist',   require('./routes/wishlist'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/vendors',    require('./routes/vendors'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/uploads',    require('./routes/uploads'));
app.use('/api/designs',    require('./routes/designs'));
app.use('/api/promo',      require('./routes/promo'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/admin',      require('./routes/admin'));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const prisma = require('./config/db');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', app: 'SpaceAura API v2.0', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` }));

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── START ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\n✨  SpaceAura Backend v2.0 Running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡  API:    http://localhost:${PORT}/api`);
  console.log(`❤️   Health: http://localhost:${PORT}/api/health`);
  console.log(`🌍  Mode:   ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Fixes Applied:');
  console.log('   → Google OAuth /google + /google/callback routes added');
  console.log('   → Vite React dev server (port 5173) added to CORS');
  console.log('   → All APIs ready for React frontend\n');
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});
