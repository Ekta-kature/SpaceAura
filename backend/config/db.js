// config/db.js — Prisma client singleton
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: 'minimal',
});

// Test connection on first use
let connected = false;
prisma.$connect()
  .then(() => { connected = true; console.log('✅ Database connected'); })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    console.error('   Check your DATABASE_URL and DIRECT_URL in .env');
    console.error('   Run: npx prisma db push  to sync schema');
  });

module.exports = prisma;
