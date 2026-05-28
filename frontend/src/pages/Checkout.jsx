import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { paymentsApi, ordersApi, promoApi, usersApi } from '../lib/api';

const DELIVERY_OPTIONS = [
  { value:'standard', label:'Standard Delivery',  sub:'5-7 business days', price:0,    note:'Free' },
  { value:'express',  label:'Express Delivery',    sub:'1-2 business days', price:999,  note:'₹999' },
  { value:'assembly', label:'Assembly & Install',  sub:'Full setup service', price:2499, note:'₹2,499' },
];

export default function Checkout() {
  const { user, isLoggedIn } = useAuth();
  const { items, total: cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep]             = useState(1); // 1=address, 2=review+pay
  const [delivery, setDelivery]     = useState('standard');
  const [addresses, setAddresses]   = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [promoCode, setPromoCode]   = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [newAddr, setNewAddr]       = useState({ label:'Home', street:'', landmark:'', city:'', state:'', pincode:'', isDefault:false });
  const [addingAddr, setAddingAddr] = useState(false);
  const [showNewAddr, setShowNewAddr] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login?redirect=/checkout'); return; }
    if (!items?.length) { navigate('/cart'); return; }
    usersApi.addresses().then(({ data }) => {
      setAddresses(data.addresses || []);
      const def = data.addresses?.find(a=>a.isDefault) || data.addresses?.[0];
      if (def) setSelectedAddr(def.id);
    });
  }, [isLoggedIn, items]);

  // ── Dynamic price calculation ──────────────────────────────
  const deliveryCharge = DELIVERY_OPTIONS.find(o=>o.value===delivery)?.price || 0;
  const discount       = promoResult?.discount || 0;
  const subtotal       = cartTotal;
  const gst            = Math.round((subtotal - discount) * 0.18);
  const total          = subtotal - discount + gst + deliveryCharge;

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError('');
    try {
      const { data } = await promoApi.validate(promoCode, subtotal);
      setPromoResult(data);
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Invalid promo code.');
      setPromoResult(null);
    } finally { setPromoLoading(false); }
  };

  const handleSaveAddress = async () => {
    if (!newAddr.street || !newAddr.city || !newAddr.state || !newAddr.pincode) return;
    setAddingAddr(true);
    try {
      const { data } = await usersApi.addAddress(newAddr);
      setAddresses(a => [...a, data.address]);
      setSelectedAddr(data.address.id);
      setShowNewAddr(false);
      setNewAddr({ label:'Home', street:'', landmark:'', city:'', state:'', pincode:'', isDefault:false });
    } catch {}
    setAddingAddr(false);
  };

  const handlePay = async () => {
    if (!selectedAddr) { alert('Please select a delivery address.'); return; }
    setProcessing(true);
    try {
      // Step 1: Create Razorpay order
      const { data: payData } = await paymentsApi.createOrder(total, {
        items: items.length,
        delivery,
      });

      // Step 2: Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: payData.key,
        amount: payData.order.amount,
        currency: 'INR',
        name: 'SpaceAura',
        description: `${items.length} item(s) — ${DELIVERY_OPTIONS.find(o=>o.value===delivery)?.label}`,
        image: '/favicon.svg',
        order_id: payData.order.id,
        prefill: {
          name:  user?.name,
          email: user?.email,
        },
        theme: { color: '#c9a96e' },
        handler: async (response) => {
          try {
            // Step 3: Create order in DB
            const orderPayload = {
              items: items.map(i => ({ productId: i.productId, qty: i.qty })),
              addressId: selectedAddr,
              deliveryType: delivery,
              promoCode: promoCode || undefined,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            };
            const { data: orderData } = await ordersApi.create(orderPayload);

            // Step 4: Verify signature
            await paymentsApi.verify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId: orderData.order.id,
            });

            await clearCart();
            navigate(`/orders?success=${orderData.order.orderNumber}`);
          } catch (e) {
            alert('Payment verified but order creation failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      });
      rzp.open();
    } catch (e) {
      alert(e.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const setA = (k) => (e) => setNewAddr(a => ({ ...a, [k]: e.target.value }));

  return (
    <div className="container" style={{ padding:'48px 24px', maxWidth:1100 }}>
      <h1 style={s.title}>Checkout</h1>

      <div style={s.layout}>
        {/* Left: Address + Delivery */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:24 }}>

          {/* Delivery Address */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>
              <span style={s.stepNum}>1</span>
              Delivery Address
            </h2>

            {addresses.map(addr => (
              <label key={addr.id} style={s.addrOption}>
                <input type="radio" name="addr" value={addr.id} checked={selectedAddr===addr.id} onChange={() => setSelectedAddr(addr.id)} style={{ accentColor:'#c9a96e' }} />
                <div style={s.addrDetail}>
                  <div style={s.addrLabel}>{addr.label}</div>
                  <div style={s.addrText}>{addr.street}{addr.landmark ? `, ${addr.landmark}` : ''}</div>
                  <div style={s.addrText}>{addr.city}, {addr.state} — {addr.pincode}</div>
                </div>
              </label>
            ))}

            <button onClick={() => setShowNewAddr(v=>!v)} className="btn btn-ghost btn-sm" style={{ marginTop:8 }}>
              {showNewAddr ? '− Cancel' : '+ Add New Address'}
            </button>

            {showNewAddr && (
              <div style={s.newAddrForm}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Label</label>
                    <input className="form-input" value={newAddr.label} onChange={setA('label')} placeholder="Home / Work" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input className="form-input" value={newAddr.pincode} onChange={setA('pincode')} placeholder="400001" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input className="form-input" value={newAddr.street} onChange={setA('street')} placeholder="House/Flat No., Street Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark</label>
                  <input className="form-input" value={newAddr.landmark} onChange={setA('landmark')} placeholder="Near..." />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-input" value={newAddr.city} onChange={setA('city')} placeholder="Mumbai" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input className="form-input" value={newAddr.state} onChange={setA('state')} placeholder="Maharashtra" />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSaveAddress} disabled={addingAddr}>
                  {addingAddr ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            )}
          </div>

          {/* Delivery Type */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>
              <span style={s.stepNum}>2</span>
              Delivery Method
            </h2>
            {DELIVERY_OPTIONS.map(opt => (
              <label key={opt.value} style={{ ...s.deliveryOption, ...(delivery===opt.value ? s.deliveryActive : {}) }}>
                <input type="radio" name="delivery" value={opt.value} checked={delivery===opt.value} onChange={() => setDelivery(opt.value)} style={{ accentColor:'#c9a96e' }} />
                <div style={{ flex:1 }}>
                  <div style={s.deliveryLabel}>{opt.label}</div>
                  <div style={s.deliverySub}>{opt.sub}</div>
                </div>
                <div style={s.deliveryPrice}>{opt.note}</div>
              </label>
            ))}
          </div>

          {/* Promo Code */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>
              <span style={s.stepNum}>3</span>
              Promo Code
            </h2>
            <div style={{ display:'flex', gap:10 }}>
              <input className="form-input" placeholder="Enter promo code (e.g. WELCOME10)" value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} style={{ flex:1 }} />
              <button className="btn btn-outline btn-sm" onClick={validatePromo} disabled={promoLoading} style={{ whiteSpace:'nowrap' }}>
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
            {promoError && <p style={{ color:'var(--red)', fontSize:13, marginTop:8 }}>{promoError}</p>}
            {promoResult?.valid && (
              <p style={{ color:'var(--green)', fontSize:13, marginTop:8 }}>
                ✓ {promoResult.discountPercent ? `${promoResult.discountPercent}% off` : ''} — You save ₹{promoResult.discount.toLocaleString('en-IN')}!
              </p>
            )}
            <p style={{ fontSize:11, color:'#3a3a3a', marginTop:8 }}>Try: WELCOME10, SPACE20, FIRST500</p>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div style={s.summary}>
          <h2 style={s.cardTitle}>Order Summary</h2>

          {/* Items */}
          <div style={{ marginBottom:20 }}>
            {items.map(item => (
              <div key={item.id} style={s.summaryItem}>
                <img
                  src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100'}
                  alt={item.product?.name}
                  style={s.summaryImg}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={s.summaryItemName}>{item.product?.name}</p>
                  <p style={s.summaryItemQty}>Qty: {item.qty}</p>
                </div>
                <span style={s.summaryItemPrice}>₹{(item.product?.price * item.qty).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div style={s.summaryDivider} />

          {/* Price breakdown — all dynamic from backend logic */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            {[
              ['Subtotal', `₹${subtotal.toLocaleString('en-IN')}`],
              ['GST (18%)', `₹${gst.toLocaleString('en-IN')}`],
              ['Delivery', deliveryCharge===0 ? 'Free' : `₹${deliveryCharge.toLocaleString('en-IN')}`],
              ...(discount ? [['Discount', `-₹${discount.toLocaleString('en-IN')}`]] : []),
            ].map(([label, val]) => (
              <div key={label} style={s.priceRow}>
                <span style={s.priceLabel}>{label}</span>
                <span style={{ ...s.priceVal, ...(label==='Discount' ? { color:'var(--green)' } : {}) }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={s.summaryDivider} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#f5f0eb' }}>Total</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:24, color:'#c9a96e', fontWeight:600 }}>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'16px' }}
            onClick={handlePay}
            disabled={processing || !selectedAddr || !items?.length}
          >
            {processing ? 'Opening Payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
          </button>

          <div style={s.secureNote}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secured by Razorpay. Your payment info is encrypted.
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  title:   { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, marginBottom:40 },
  layout:  { display:'flex', gap:40, alignItems:'flex-start' },
  card:    { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, display:'flex', flexDirection:'column', gap:16 },
  cardTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', display:'flex', alignItems:'center', gap:12 },
  stepNum: { width:28, height:28, background:'#c9a96e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#0a0a0a', fontWeight:700, fontFamily:"'DM Sans',sans-serif", flexShrink:0 },

  addrOption: { display:'flex', gap:14, padding:'16px', background:'#0f0f0f', borderRadius:6, border:'1px solid #1a1a1a', cursor:'pointer', alignItems:'flex-start' },
  addrLabel:  { fontSize:12, color:'#c9a96e', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 },
  addrDetail: { flex:1 },
  addrText:   { fontSize:13, color:'#9e9890' },
  newAddrForm:{ display:'flex', flexDirection:'column', gap:12, background:'#0f0f0f', padding:20, borderRadius:6, border:'1px solid #1a1a1a' },

  deliveryOption:{ display:'flex', gap:14, padding:'16px', background:'#0f0f0f', borderRadius:6, border:'1px solid #1a1a1a', cursor:'pointer', alignItems:'center', transition:'border-color 0.2s' },
  deliveryActive:{ borderColor:'#c9a96e' },
  deliveryLabel: { fontSize:14, color:'#f5f0eb', marginBottom:2 },
  deliverySub:   { fontSize:12, color:'#5c5852' },
  deliveryPrice: { fontSize:14, color:'#c9a96e', fontFamily:"'DM Mono',monospace", fontWeight:600 },

  summary:     { width:380, flexShrink:0, background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, position:'sticky', top:88, display:'flex', flexDirection:'column', gap:0 },
  summaryItem: { display:'flex', gap:12, alignItems:'center', marginBottom:14 },
  summaryImg:  { width:56, height:56, objectFit:'cover', borderRadius:6, flexShrink:0 },
  summaryItemName: { fontSize:13, color:'#f5f0eb', lineHeight:1.3 },
  summaryItemQty:  { fontSize:12, color:'#5c5852', marginTop:2 },
  summaryItemPrice:{ fontSize:14, color:'#9e9890', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' },
  summaryDivider:  { height:1, background:'#1a1a1a', margin:'4px 0 16px' },
  priceRow:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  priceLabel:  { fontSize:13, color:'#5c5852' },
  priceVal:    { fontSize:14, color:'#9e9890', fontFamily:"'DM Mono',monospace" },
  secureNote:  { display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#3a3a3a', justifyContent:'center', marginTop:12 },
};
