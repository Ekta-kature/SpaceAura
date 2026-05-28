const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error:'Email required.' });
    await prisma.newsletter.upsert({ where:{ email }, update:{ isActive:true }, create:{ email } });
    res.json({ message:'Subscribed! Welcome to SpaceAura. 🎉' });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post('/unsubscribe', async (req, res) => {
  try {
    await prisma.newsletter.update({ where:{ email:req.body.email }, data:{ isActive:false } });
    res.json({ message:'Unsubscribed.' });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/subscribers', protect, isAdmin, async (_req, res) => {
  try {
    const subs = await prisma.newsletter.findMany({ where:{ isActive:true }, orderBy:{ createdAt:'desc' } });
    res.json({ subscribers:subs, total:subs.length });
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports = router;
