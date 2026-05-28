const router = require('express').Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({ where: { userId: req.user.id },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 }, category: { select: { name: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' } });
    res.json({ items, count: items.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/toggle', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const ex = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: req.user.id, productId } } });
    if (ex) { await prisma.wishlistItem.delete({ where: { userId_productId: { userId: req.user.id, productId } } }); return res.json({ wishlisted: false, message: 'Removed.' }); }
    await prisma.wishlistItem.create({ data: { userId: req.user.id, productId } });
    res.json({ wishlisted: true, message: 'Added!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/check/:productId', protect, async (req, res) => {
  try {
    const item = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } } });
    res.json({ wishlisted: !!item });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:productId', protect, async (req, res) => {
  try { await prisma.wishlistItem.delete({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } } }); res.json({ message: 'Removed.' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
