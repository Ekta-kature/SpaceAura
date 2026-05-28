const router = require('express').Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id:true, email:true, name:true, phone:true, city:true, avatar:true, role:true, createdAt:true,
        addresses: true,
        vendor: { include: { portfolioImages: { take: 6, orderBy: { order: 'asc' } } } },
        _count: { select: { orders: true, wishlist: true } },
      },
    });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, city } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, phone, city }, select: { id:true, email:true, name:true, phone:true, city:true, avatar:true } });
    res.json({ message: 'Profile updated!', user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/addresses', protect, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: { isDefault: 'desc' } });
    res.json({ addresses });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/addresses', protect, async (req, res) => {
  try {
    const { label, street, landmark, city, state, pincode, isDefault } = req.body;
    if (!street || !city || !state || !pincode) return res.status(400).json({ error: 'Street, city, state, pincode required.' });
    if (isDefault) await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const address = await prisma.address.create({ data: { userId: req.user.id, label: label || 'Home', street, landmark, city, state, pincode, isDefault: !!isDefault } });
    res.status(201).json({ address });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/addresses/:id', protect, async (req, res) => {
  try {
    const { label, street, landmark, city, state, pincode, isDefault } = req.body;
    if (isDefault) await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const address = await prisma.address.update({ where: { id: req.params.id, userId: req.user.id }, data: { label, street, landmark, city, state, pincode, isDefault: !!isDefault } });
    res.json({ address });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/addresses/:id', protect, async (req, res) => {
  try { await prisma.address.delete({ where: { id: req.params.id, userId: req.user.id } }); res.json({ message: 'Deleted.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user.id }, include: { items: true, address: true }, orderBy: { createdAt: 'desc' } });
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my-projects', protect, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { customerId: req.user.id },
      include: { vendor: { include: { user: { select: { name: true, avatar: true } } } }, milestones: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' } });
    res.json({ projects });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
