const router = require('express').Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } });
    const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    res.json({ items, total, count: items.reduce((s, i) => s + i.qty, 0) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/add', protect, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { qty: { increment: parseInt(qty) } },
      create: { userId: req.user.id, productId, qty: parseInt(qty) },
    });
    res.json({ item });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:productId', protect, async (req, res) => {
  try {
    const { qty } = req.body;
    if (parseInt(qty) < 1) {
      await prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } } });
      return res.json({ message: 'Removed.' });
    }
    const item = await prisma.cartItem.update({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } }, data: { qty: parseInt(qty) } });
    res.json({ item });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:productId', protect, async (req, res) => {
  try { await prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } } }); res.json({ message: 'Removed.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/', protect, async (req, res) => {
  try { await prisma.cartItem.deleteMany({ where: { userId: req.user.id } }); res.json({ message: 'Cart cleared.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
