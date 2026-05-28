// prisma/seed.js — Clean seed: Admin user + Categories ONLY
// NO fake vendors, NO dummy products — your real users will create those
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SpaceAura database (clean — no fake vendors)...\n');

  // ── ADMIN USER ─────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@spaceaura.com' },
    update: {},
    create: {
      email: 'admin@spaceaura.com',
      password: adminPass,
      name: 'SpaceAura Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin user:', admin.email);

  // ── CATEGORIES ─────────────────────────────────────────────
  const categories = [
    { name: 'Sofas & Sectionals',   slug: 'sofas',        description: 'Comfort meets style — find your perfect sofa',          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
    { name: 'Beds & Mattresses',    slug: 'beds',          description: 'Sleep better with our bedroom collection',               image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400' },
    { name: 'Dining Sets',          slug: 'dining',        description: 'Gather around beautifully crafted dining furniture',     image: 'https://images.unsplash.com/photo-1615066945284-b9ceae1e9539?w=400' },
    { name: 'Lighting',             slug: 'lighting',      description: 'Illuminate your space with stunning light fixtures',     image: 'https://images.unsplash.com/photo-1602872029708-84d970d3382f?w=800&q=80' },
    { name: 'Rugs & Carpets',       slug: 'rugs',          description: 'Ground your room with beautiful rugs',                   image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
    { name: 'Wall Decor',           slug: 'wall-decor',    description: 'Art, mirrors and wall accents for every style',          image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400' },
    { name: 'Storage Solutions',    slug: 'storage',       description: 'Organize beautifully with our storage collection',       image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400' },
    { name: 'Outdoor Furniture',    slug: 'outdoor',       description: 'Bring your indoor style outside',                        image: 'https://images.unsplash.com/photo-1600210491892-03d54078f2b5?w=400' },
    { name: 'Office & Study',       slug: 'office',        description: 'Work from home in style',                                image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400' },
    { name: 'Kids Room',            slug: 'kids',          description: 'Fun and safe furniture for little ones',                 image: 'https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=400' },
    { name: 'Bathroom',             slug: 'bathroom',      description: 'Transform your bathroom into a spa retreat',             image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400' },
    { name: 'Kitchen & Dining',     slug: 'kitchen',       description: 'Kitchen accessories and small furniture',                image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, image: cat.image },
      create: cat,
    });
    console.log('✅ Category:', cat.name);
  }

  // ── PROMO CODES ────────────────────────────────────────────
  const promos = [
    { code: 'WELCOME10', discountPercent: 10, minOrderValue: 1000, maxUses: 1000, isActive: true },
    { code: 'SPACE20',   discountPercent: 20, minOrderValue: 5000, maxUses: 500,  isActive: true },
    { code: 'FIRST500',  discountAmount: 500, minOrderValue: 2000, maxUses: 200,  isActive: true },
  ];

  for (const promo of promos) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
    console.log('✅ Promo code:', promo.code);
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin login: admin@spaceaura.com / Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nNo fake vendors or products were created.');
  console.log('Real vendors must register and add products themselves.\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
