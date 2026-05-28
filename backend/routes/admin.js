const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/stats', protect, isAdmin, async (_req, res) => {
  try {
    const [users,vendors,products,orders,revenue,pending] = await Promise.all([
      prisma.user.count(), prisma.vendor.count(),
      prisma.product.count({ where:{ isActive:true } }), prisma.order.count(),
      prisma.order.aggregate({ _sum:{ total:true }, where:{ paymentStatus:'paid' } }),
      prisma.order.count({ where:{ status:'PENDING' } }),
    ]);
    const recentOrders = await prisma.order.findMany({ take:5, orderBy:{ createdAt:'desc' }, include:{ user:{ select:{ name:true,email:true } }, items:true } });
    res.json({ stats:{ users,vendors,products,orders,revenue:revenue._sum.total||0,pending }, recentOrders });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const { page=1, limit=20, role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [{ name:{ contains:search,mode:'insensitive' } },{ email:{ contains:search,mode:'insensitive' } }];
    const [users,total] = await Promise.all([
      prisma.user.findMany({ where, skip:(parseInt(page)-1)*parseInt(limit), take:parseInt(limit), orderBy:{ createdAt:'desc' }, select:{ id:true,email:true,name:true,role:true,city:true,createdAt:true,isVerified:true } }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, pages:Math.ceil(total/parseInt(limit)) });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/vendors', protect, isAdmin, async (_req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ include:{ user:{ select:{ name:true,email:true } } }, orderBy:{ createdAt:'desc' } });
    res.json({ vendors });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.patch('/vendors/:id/verify', protect, isAdmin, async (req, res) => {
  try { const v = await prisma.vendor.update({ where:{ id:req.params.id }, data:{ isVerified:true } }); res.json({ vendor:v }); }
  catch(e){ res.status(500).json({error:e.message}); }
});
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try { await prisma.user.delete({ where:{ id:req.params.id } }); res.json({ message:'Deleted.' }); }
  catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/orders', protect, isAdmin, async (req, res) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const where = status?{ status }:{};
    const [orders,total] = await Promise.all([
      prisma.order.findMany({ where, skip:(parseInt(page)-1)*parseInt(limit), take:parseInt(limit), include:{ user:{ select:{ name:true,email:true } }, items:true }, orderBy:{ createdAt:'desc' } }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, pages:Math.ceil(total/parseInt(limit)) });
  } catch(e){ res.status(500).json({error:e.message}); }
});
module.exports = router;
