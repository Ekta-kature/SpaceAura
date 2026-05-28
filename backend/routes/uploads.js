const router = require('express').Router();
const { protect } = require('../middleware/auth');
const prisma = require('../config/db');

let uploadProduct, uploadPortfolio, uploadAvatar, cloudinary;
try {
  const cfg = require('../config/cloudinary');
  uploadProduct = cfg.uploadProduct;
  uploadPortfolio = cfg.uploadPortfolio;
  uploadAvatar = cfg.uploadAvatar;
  cloudinary = cfg.cloudinary;
} catch (e) { console.warn('Cloudinary not configured:', e.message); }

const noOp = (req, res, next) => next();

router.post('/product', protect, uploadProduct ? uploadProduct.array('images', 10) : noOp, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded.' });
    const urls = req.files.map(f => ({ url: f.path, publicId: f.filename }));
    res.json({ urls, message: `${urls.length} image(s) uploaded!` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/portfolio', protect, uploadPortfolio ? uploadPortfolio.array('images', 10) : noOp, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded.' });
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return res.status(403).json({ error: 'Vendor profile required.' });
    const saved = await Promise.all(req.files.map((f, i) => prisma.portfolioImage.create({ data: { vendorId: vendor.id, url: f.path, order: i } })));
    res.json({ images: saved, message: `${saved.length} image(s) uploaded!` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/avatar', protect, uploadAvatar ? uploadAvatar.single('avatar') : noOp, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatar: req.file.path }, select: { id: true, avatar: true } });
    res.json({ url: req.file.path, user, message: 'Avatar updated!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/portfolio/:imageId', protect, async (req, res) => {
  try {
    const image = await prisma.portfolioImage.findUnique({ where: { id: req.params.imageId } });
    if (!image) return res.status(404).json({ error: 'Image not found.' });
    if (cloudinary && image.url) {
      const pub = image.url.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(`spaceaura/portfolio/${pub}`).catch(() => {});
    }
    await prisma.portfolioImage.delete({ where: { id: req.params.imageId } });
    res.json({ message: 'Image deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
