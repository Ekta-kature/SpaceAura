const router = require('express').Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const prisma = require('../config/db');

let razorpay;
try {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
} catch (e) { console.warn('Razorpay not initialized:', e.message); }

router.post('/create-order', protect, async (req, res) => {
  try {
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway not configured.' });
    const { amount, currency = 'INR', notes = {} } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Valid amount required.' });
    const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency, receipt: 'sa_' + Date.now(), notes });
    res.json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Payment verification failed.' });
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { paymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, paymentStatus: 'paid', status: 'CONFIRMED' } });
    }
    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/consultation', protect, async (req, res) => {
  try {
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway not configured.' });
    const vendor = await prisma.vendor.findUnique({ where: { id: req.body.vendorId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    const order = await razorpay.orders.create({ amount: Math.round(vendor.consultationFee * 100), currency: 'INR', receipt: 'consult_' + Date.now() });
    res.json({ order, key: process.env.RAZORPAY_KEY_ID, amount: vendor.consultationFee });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
