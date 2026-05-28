const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isVendor, isAdmin } = require('../middleware/auth');

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const { page=1, limit=12, search, category, badge, minPrice, maxPrice, sort='createdAt', order='desc', rating, vendorId } = req.query;
    const where = { isActive: true };
    if (search) where.OR = [{ name:{contains:search,mode:'insensitive'} }, { description:{contains:search,mode:'insensitive'} }];
    if (category) where.category = { slug: category };
    if (badge) where.badge = badge;
    if (vendorId) where.vendorId = vendorId;
    if (minPrice || maxPrice) where.price = { ...(minPrice && {gte:parseFloat(minPrice)}), ...(maxPrice && {lte:parseFloat(maxPrice)}) };
    if (rating) where.rating = { gte: parseFloat(rating) };
    const ob = {};
    if (['price','rating','createdAt','totalReviews'].includes(sort)) ob[sort] = order;
    const skip = (parseInt(page)-1)*parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy:ob, skip, take:parseInt(limit),
        include: { images:{where:{isPrimary:true},take:1}, category:{select:{name:true,slug:true}}, vendor:{select:{id:true,businessName:true,isVerified:true}} }
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, page:parseInt(page), pages:Math.ceil(total/parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { OR:[{id:req.params.id},{slug:req.params.id}], isActive:true },
      include: {
        images: { orderBy:{order:'asc'} },
        category: true,
        vendor: { include:{ user:{select:{avatar:true,name:true}}, portfolioImages:{take:3} } },
        reviews: { take:5, orderBy:{createdAt:'desc'}, include:{ user:{select:{name:true,avatar:true}} } },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RELATED
router.get('/:id/related', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({ where:{id:req.params.id}, select:{categoryId:true} });
    if (!p) return res.status(404).json({ error: 'Not found.' });
    const related = await prisma.product.findMany({
      where:{ categoryId:p.categoryId, id:{not:req.params.id}, isActive:true }, take:4,
      include:{ images:{where:{isPrimary:true},take:1} },
    });
    res.json({ products: related });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE (vendor/admin)
router.post('/', protect, isVendor, async (req, res) => {
  try {
    const { name, description, price, oldPrice, badge, categoryId, specs, tags, images } = req.body;
    const vendor = await prisma.vendor.findUnique({ where:{userId:req.user.id} });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + Date.now();
    const product = await prisma.product.create({
      data: { name, description, price:parseFloat(price), oldPrice:oldPrice?parseFloat(oldPrice):null,
        badge, categoryId, vendorId:vendor?.id, specs:specs||{}, tags:tags||[], slug,
        images: images?.length ? { create: images.map((url,i) => ({url, isPrimary:i===0, order:i})) } : undefined },
      include: { images:true, category:true },
    });
    res.status(201).json({ product });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE
router.put('/:id', protect, isVendor, async (req, res) => {
  try {
    const { name, description, price, oldPrice, badge, specs, tags, isActive } = req.body;
    const product = await prisma.product.update({ where:{id:req.params.id},
      data:{ name, description, price:price?parseFloat(price):undefined, oldPrice:oldPrice?parseFloat(oldPrice):null, badge, specs, tags, isActive } });
    res.json({ product });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
