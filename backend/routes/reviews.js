const router = require('express').Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { productId, vendorId, rating, comment, title } = req.body;
    if (!productId && !vendorId) return res.status(400).json({ error: 'productId or vendorId required.' });
    if (!rating || !comment) return res.status(400).json({ error: 'Rating and comment required.' });
    const review = await prisma.review.create({
      data: { userId: req.user.id, productId, vendorId, rating: parseInt(rating), comment, title },
      include: { user: { select: { name: true, avatar: true } } },
    });
    if (productId) {
      const agg = await prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { rating: true } });
      await prisma.product.update({ where: { id: productId }, data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, totalReviews: agg._count.rating } });
    }
    if (vendorId) {
      const agg = await prisma.review.aggregate({ where: { vendorId }, _avg: { rating: true }, _count: { rating: true } });
      await prisma.vendor.update({ where: { id: vendorId }, data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, totalReviews: agg._count.rating } });
    }
    res.status(201).json({ message: 'Review submitted!', review });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where: { productId: req.params.productId }, include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.review.count({ where: { productId: req.params.productId } }),
    ]);
    res.json({ reviews, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where: { vendorId: req.params.vendorId }, include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.review.count({ where: { vendorId: req.params.vendorId } }),
    ]);
    res.json({ reviews, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Not found.' });
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Not authorized.' });
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
