// config/email.js — SendGrid email (gracefully skipped if not configured)
let sgMail;
try {
  sgMail = require('@sendgrid/mail');
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch(e) {}

const FROM = {
  email: process.env.FROM_EMAIL || 'noreply@spaceaura.com',
  name:  process.env.FROM_NAME  || 'SpaceAura',
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV === 'development' || !process.env.SENDGRID_API_KEY || !sgMail) {
    console.log(`📧 [Email skipped in dev] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await sgMail.send({ from: FROM, to, subject, html: html || text, text: text || '' });
  } catch(e) {
    console.warn('Email send failed:', e.message);
  }
};

const templates = {
  welcome: (name) => ({
    subject: `Welcome to SpaceAura! 🏠`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h1 style="color:#1A1714;font-size:28px;">Welcome, ${name}! 🎉</h1>
      <p style="color:#7A7268;font-size:16px;line-height:1.8;">Your SpaceAura account is ready. Start exploring 500+ verified designers and 10,000+ curated products.</p>
      <a href="${process.env.FRONTEND_URL||'http://localhost:5500'}" style="display:inline-block;background:#B5601A;color:white;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px;">Explore SpaceAura →</a>
    </div>`,
  }),
  orderConfirmed: (name, orderNumber, total) => ({
    subject: `Order Confirmed — #${orderNumber} 📦`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h1 style="color:#1A1714;">Your order is confirmed! ✓</h1>
      <p style="color:#7A7268;">Hi ${name}, we've received your order.</p>
      <div style="background:#F7F4EF;border-radius:12px;padding:20px;margin:24px 0;">
        <div style="font-size:14px;color:#7A7268;">Order Number</div>
        <div style="font-size:22px;font-weight:700;color:#B5601A;">#${orderNumber}</div>
        <div style="font-size:14px;color:#7A7268;margin-top:12px;">Total</div>
        <div style="font-size:22px;font-weight:700;">₹${(total||0).toLocaleString('en-IN')}</div>
      </div>
    </div>`,
  }),
  consultationBooked: (customerName, vendorName, date, meetingType) => ({
    subject: `Consultation Booked with ${vendorName} ✅`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h1 style="color:#1A1714;">Consultation Confirmed! 🎨</h1>
      <p style="color:#7A7268;">Hi ${customerName}, your session with <strong>${vendorName}</strong> is confirmed.</p>
      <div style="background:#F7F4EF;border-radius:12px;padding:20px;margin:24px 0;">
        <p><strong>Designer:</strong> ${vendorName}</p>
        <p><strong>Date:</strong> ${date ? new Date(date).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : 'TBD'}</p>
        <p><strong>Type:</strong> ${meetingType||'Video Call'}</p>
      </div>
    </div>`,
  }),
  newLead: (vendorName, leadName, message) => ({
    subject: `New Enquiry from ${leadName} 💬`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <h1 style="color:#1A1714;">New Lead! 🚀</h1>
      <p style="color:#7A7268;">Hi ${vendorName}, you have a new enquiry on SpaceAura.</p>
      <div style="background:#F7F4EF;border-radius:12px;padding:20px;margin:24px 0;">
        <p><strong>From:</strong> ${leadName}</p>
        <p><strong>Message:</strong> ${message||'No message provided.'}</p>
      </div>
    </div>`,
  }),
};

module.exports = { sendEmail, templates };
