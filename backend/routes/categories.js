const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const cats = await prisma.category.findMany({ orderBy:{ name:'asc' }, include:{ _count:{ select:{ products:true } } } });
    res.json({ categories: cats });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/:slug', async (req, res) => {
  try {
    const cat = await prisma.category.findUnique({ where:{ slug:req.params.slug } });
    if (!cat) return res.status(404).json({error:'Not found.'});
    res.json({ category: cat });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const cat = await prisma.category.create({ data:{ name, slug, description, image } });
    res.status(201).json({ category: cat });
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports = router;
