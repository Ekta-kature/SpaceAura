# SpaceAura v2.0 — Complete Setup Guide
## What's Fixed in This Version

### ✅ All 7 Issues Resolved:
1. **Google Login** — Backend now has `/api/auth/google` + `/api/auth/google/callback` routes
2. **Upload Feature** — Frontend sends real `multipart/form-data` with Bearer token to Cloudinary
3. **Payment** — Real Razorpay modal opens, user pays, THEN order is created in DB
4. **Checkout Prices** — Delivery price changes dynamically (Standard ₹0, Express ₹999, Assembly ₹2,499)
5. **Vendor Profile Photo** — Fixed with `object-fit: cover` + proper circular container
6. **Real-time Chat** — Socket.io client connects with JWT auth, live typing indicators
7. **No Fake Vendors** — Seed file only adds admin + categories. Vendors register themselves.

---

## Setup Instructions

### Step 1 — Backend
```bash
cd spaceaura-fixed/backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```
Backend runs at: http://localhost:5000

### Step 2 — Frontend (React + Vite)
```bash
cd spaceaura-fixed/frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Google OAuth Setup (to fix Google login)

1. Go to https://console.cloud.google.com
2. Create a project → Enable "Google+ API" or "Google Identity"
3. Go to Credentials → Create OAuth 2.0 Client ID
4. Set **Authorized redirect URIs** to:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. Copy Client ID and Client Secret into `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```
6. Restart backend

The "Continue with Google" button now redirects to real Google login.
On success, it redirects to `http://localhost:5173/auth/callback?token=...` and logs you in.

---

## Razorpay Test Mode

Your Razorpay test keys are already in `.env`. Use these test cards:
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 1234 (or any)

---

## Admin Account
```
Email:    admin@spaceaura.com
Password: Admin@123
```

---

## File Structure
```
spaceaura-fixed/
├── backend/
│   ├── routes/
│   │   └── auth.js          ← FIXED: Google OAuth routes added
│   ├── server.js            ← FIXED: Vite CORS added
│   ├── prisma/
│   │   └── seed.js          ← FIXED: No fake vendors
│   └── .env                 ← Your credentials (already configured)
│
└── frontend/                ← NEW: React + Vite frontend
    ├── src/
    │   ├── lib/
    │   │   ├── api.js       ← Complete API client for all routes
    │   │   └── socket.js    ← Real Socket.io client
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── CartContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   └── ProductCard.jsx
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Shop.jsx         ← Filters, search, pagination — all dynamic
    │       ├── Product.jsx      ← Reviews, add to cart, wishlist
    │       ├── Cart.jsx
    │       ├── Checkout.jsx     ← Real Razorpay + dynamic pricing
    │       ├── Login.jsx        ← Google OAuth button
    │       ├── Register.jsx
    │       ├── AuthCallback.jsx ← Handles Google OAuth redirect
    │       ├── Vendors.jsx      ← No fake vendors, real DB data
    │       ├── VendorProfile.jsx ← Avatar fixed, real chat button
    │       ├── Chat.jsx         ← Real Socket.io chat
    │       ├── Dashboard.jsx
    │       ├── Profile.jsx      ← Real avatar upload
    │       ├── Wishlist.jsx
    │       ├── Orders.jsx       ← Order cancellation
    │       ├── VendorRegister.jsx
    │       └── VendorDashboard.jsx ← Leads, products, portfolio upload
    └── package.json
```
