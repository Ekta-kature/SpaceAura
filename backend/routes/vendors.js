const router = require('express').Router();
const prisma = require('../config/db');
const { protect, isVendor, isAdmin } = require('../middleware/auth');

// GET ALL VENDORS
router.get('/', async (req, res) => {
  try {
    const { page=1, limit=12, city, specialty, verified, rating, sort='rating', search, fee } = req.query;
    const where = { isActive: true };
    if (city) where.location = { contains: city, mode: 'insensitive' };
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (verified === 'true') where.isVerified = true;
    if (rating) where.rating = { gte: parseFloat(rating) };
    if (search) where.OR = [
      { businessName: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { specialty: { contains: search, mode: 'insensitive' } },
    ];
    if (fee === 'under3k') where.consultationFee = { lt: 3000 };
    else if (fee === '3k-5k') where.consultationFee = { gte: 3000, lte: 5000 };
    else if (fee === 'over5k') where.consultationFee = { gt: 5000 };

    const ob = sort === 'projects' ? { totalProjects: 'desc' } : sort === 'fee-low' ? { consultationFee: 'asc' } : sort === 'fee-high' ? { consultationFee: 'desc' } : { rating: 'desc' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where, orderBy: ob, skip, take: parseInt(limit),
        include: {
          user: { select: { name: true, avatar: true, email: true } },
          portfolioImages: { take: 6, orderBy: { order: 'asc' } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);
    res.json({ vendors, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET SINGLE VENDOR (by vendor id OR user id)
router.get('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ id: req.params.id }, { userId: req.params.id }], isActive: true },
      include: {
        user: { select: { name: true, avatar: true, email: true } },
        portfolioImages: { orderBy: { order: 'asc' } },
        reviews: {
          take: 10, orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    res.json({ vendor });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE VENDOR PROFILE
router.post('/', protect, async (req, res) => {
  try {
    const exists = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (exists) return res.status(409).json({ error: 'Vendor profile already exists.' });
    const { businessName, specialty, bio, experience, location, consultationFee, styles, coverImage } = req.body;
    const vendor = await prisma.vendor.create({
      data: { userId: req.user.id, businessName, specialty, bio, experience: parseInt(experience) || 1, location, consultationFee: parseFloat(consultationFee) || 2000, styles: styles || [], coverImage },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'VENDOR' } });
    res.status(201).json({ vendor });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE MY VENDOR PROFILE
router.put('/me', protect, isVendor, async (req, res) => {
  try {
    const { businessName, specialty, bio, experience, location, consultationFee, styles, coverImage, instagram, portfolioWebsite } = req.body;
    const vendor = await prisma.vendor.update({
      where: { userId: req.user.id },
      data: { businessName, specialty, bio, experience: experience ? parseInt(experience) : undefined, location, consultationFee: consultationFee ? parseFloat(consultationFee) : undefined, styles, coverImage, instagram, portfolioWebsite },
    });
    res.json({ vendor });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// BOOK CONSULTATION
router.post('/:id/consultation', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, date, meetingType, message } = req.body;
    if (!customerName || !customerEmail || !date) return res.status(400).json({ error: 'Name, email and date required.' });
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    const consult = await prisma.consultation.create({
      data: { vendorId: req.params.id, customerName, customerEmail, customerPhone, date: new Date(date), meetingType: meetingType || 'video', message, amount: vendor.consultationFee },
    });
    res.status(201).json({ message: 'Consultation booked!', consultation: consult });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SUBMIT LEAD
router.post('/:id/lead', async (req, res) => {
  try {
    const { name, email, phone, city, roomType, budget, message } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required.' });
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    const lead = await prisma.lead.create({ data: { vendorId: req.params.id, name, email, phone, city, roomType, budget, message } });
    res.status(201).json({ message: 'Enquiry sent!', lead });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET MY LEADS (vendor dashboard)
router.get('/me/leads', protect, isVendor, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found.' });
    const leads = await prisma.lead.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: 'desc' } });
    res.json({ leads });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE LEAD STATUS
router.patch('/me/leads/:leadId', protect, isVendor, async (req, res) => {
  try {
    const lead = await prisma.lead.update({ where: { id: req.params.leadId }, data: { status: req.body.status } });
    res.json({ lead });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
