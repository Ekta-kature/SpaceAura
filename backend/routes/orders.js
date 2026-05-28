const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { items, addressId, deliveryType = 'standard', promoCode, paymentId, razorpayOrderId } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in order.' });
    const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
    let subtotal = 0;
    const orderItems = items.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      subtotal += p.price * item.qty;
      return { productId: p.id, name: p.name, price: p.price, qty: item.qty };
    });
    let discount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({ where: { code: promoCode.toUpperCase(), isActive: true } });
      if (promo && subtotal >= promo.minOrderValue) {
        discount = promo.discountPercent ? subtotal * (promo.discountPercent / 100) : (promo.discountAmount || 0);
        await prisma.promoCode.update({ where: { code: promoCode.toUpperCase() }, data: { usedCount: { increment: 1 } } });
      }
    }
    const deliveryCharge = deliveryType === 'express' ? 999 : deliveryType === 'assembly' ? 2499 : 0;
    const gst = Math.round((subtotal - discount) * 0.18);
    const total = subtotal - discount + gst + deliveryCharge;
    const orderNumber = 'SA-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 900000 + 100000);
    const order = await prisma.order.create({
      data: { orderNumber, userId: req.user.id, addressId, subtotal, gst, deliveryCharge, total, discount, promoCode, deliveryType,
        paymentId, razorpayOrderId, paymentStatus: paymentId ? 'paid' : 'pending', status: paymentId ? 'CONFIRMED' : 'PENDING',
        items: { create: orderItems } },
      include: { items: true, address: true },
    });
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.status(201).json({ message: 'Order placed!', order });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user.id }, include: { items: true, address: true }, orderBy: { createdAt: 'desc' } });
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { items: true, address: true } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Not found.' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) return res.status(400).json({ error: 'Cannot cancel at this stage.' });
    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ order: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', protect, isAdmin, async (req, res) => {
  try { const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status } }); res.json({ order }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: { user: { select: { name: true, email: true } }, items: true }, orderBy: { createdAt: 'desc' }, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit) }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
