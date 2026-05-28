const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.post('/validate', protect, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const promo = await prisma.promoCode.findFirst({ where:{ code:code?.toUpperCase(), isActive:true } });
    if (!promo) return res.status(404).json({ valid:false, error:'Invalid promo code.' });
    if (promo.expiresAt && new Date()>promo.expiresAt) return res.status(400).json({ valid:false, error:'Promo code expired.' });
    if (promo.maxUses && promo.usedCount>=promo.maxUses) return res.status(400).json({ valid:false, error:'Usage limit reached.' });
    if (cartTotal && cartTotal<promo.minOrderValue) return res.status(400).json({ valid:false, error:`Min order ₹${promo.minOrderValue} required.` });
    const discount = promo.discountPercent ? (cartTotal||0)*(promo.discountPercent/100) : (promo.discountAmount||0);
    res.json({ valid:true, code:promo.code, discount:Math.round(discount), discountPercent:promo.discountPercent });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/', protect, isAdmin, async (_req, res) => {
  try { const promos = await prisma.promoCode.findMany({ orderBy:{ createdAt:'desc' } }); res.json({ promos }); }
  catch(e){ res.status(500).json({error:e.message}); }
});
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const promo = await prisma.promoCode.create({ data:{ code:req.body.code.toUpperCase(), discountPercent:req.body.discountPercent?parseFloat(req.body.discountPercent):null, discountAmount:req.body.discountAmount?parseFloat(req.body.discountAmount):null, minOrderValue:parseFloat(req.body.minOrderValue)||0, maxUses:req.body.maxUses?parseInt(req.body.maxUses):null } });
    res.status(201).json({ promo });
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports = router;
