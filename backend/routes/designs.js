const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, style, page=1, limit=12 } = req.query;
    const where = { isPublished: true };
    if (category) where.category = category;
    if (style) where.style = { contains:style, mode:'insensitive' };
    const skip = (parseInt(page)-1)*parseInt(limit);
    const [designs, total] = await Promise.all([
      prisma.design.findMany({ where, skip, take:parseInt(limit), orderBy:{ createdAt:'desc' } }),
      prisma.design.count({ where }),
    ]);
    res.json({ designs, total, pages:Math.ceil(total/parseInt(limit)) });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/:id', async (req, res) => {
  try {
    const design = await prisma.design.findUnique({ where:{ id:req.params.id } });
    if (!design) return res.status(404).json({error:'Not found.'});
    res.json({ design });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post('/', protect, isAdmin, async (req, res) => {
  try { const design = await prisma.design.create({ data:req.body }); res.status(201).json({ design }); }
  catch(e){ res.status(500).json({error:e.message}); }
});
module.exports = router;
