import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, total, count, updateQty, removeFromCart, loading } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>◎</div>
      <h2 style={s.emptyTitle}>Sign in to view your cart</h2>
      <p style={s.emptySub}>Your cart items are saved to your account.</p>
      <Link to="/login?redirect=/cart" className="btn btn-primary" style={{ marginTop:24 }}>Sign In</Link>
    </div>
  );

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  if (!items.length) return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>◻</div>
      <h2 style={s.emptyTitle}>Your cart is empty</h2>
      <p style={s.emptySub}>Add some beautiful pieces to get started.</p>
      <Link to="/shop" className="btn btn-primary" style={{ marginTop:24 }}>Browse Collection</Link>
    </div>
  );

  const gst = Math.round(total * 0.18);
  const grandTotal = total + gst;

  return (
    <div className="container" style={{ padding:'48px 24px', maxWidth:1100 }}>
      <h1 style={s.title}>Your Cart <span style={s.titleCount}>({count} items)</span></h1>

      <div style={s.layout}>
        {/* Items */}
        <div style={{ flex:1 }}>
          {items.map(item => {
            const product = item.product;
            const img = product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300';
            return (
              <div key={item.id} style={s.item}>
                <Link to={`/product/${item.productId}`}>
                  <img src={img} alt={product?.name} style={s.img} />
                </Link>
                <div style={s.details}>
                  <Link to={`/product/${item.productId}`} style={s.itemName}>{product?.name}</Link>
                  {product?.vendor && <p style={s.vendorName}>{product.vendor.businessName}</p>}
                  <p style={s.itemPrice}>₹{(product?.price || 0).toLocaleString('en-IN')} each</p>
                </div>
                <div style={s.qtyControl}>
                  <button style={s.qtyBtn} onClick={() => item.qty === 1 ? removeFromCart(item.productId) : updateQty(item.productId, item.qty-1)}>−</button>
                  <span style={s.qty}>{item.qty}</span>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.productId, item.qty+1)}>+</button>
                </div>
                <div style={s.lineTotal}>₹{((product?.price||0) * item.qty).toLocaleString('en-IN')}</div>
                <button onClick={() => removeFromCart(item.productId)} style={s.removeBtn} title="Remove">✕</button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={s.summary}>
          <h2 style={s.summaryTitle}>Order Summary</h2>
          <div style={s.row}><span style={s.label}>Subtotal</span><span style={s.val}>₹{total.toLocaleString('en-IN')}</span></div>
          <div style={s.row}><span style={s.label}>GST (18%)</span><span style={s.val}>₹{gst.toLocaleString('en-IN')}</span></div>
          <div style={s.row}><span style={s.label}>Delivery</span><span style={{ ...s.val, color:'var(--green)' }}>Calculated at checkout</span></div>
          <div style={s.divider} />
          <div style={s.row}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#f5f0eb' }}>Estimated Total</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:22, color:'#c9a96e' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:20 }} onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>
          <Link to="/shop" className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
            Continue Shopping
          </Link>
          <p style={s.secureText}>🔒 Secured by Razorpay</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  title:      { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, marginBottom:40 },
  titleCount: { fontSize:24, color:'#5c5852', fontFamily:"'DM Sans',sans-serif" },
  layout:     { display:'flex', gap:40, alignItems:'flex-start' },
  item:       { display:'flex', gap:20, alignItems:'center', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:20, marginBottom:16 },
  img:        { width:100, height:100, objectFit:'cover', borderRadius:6, flexShrink:0 },
  details:    { flex:1 },
  itemName:   { fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#f5f0eb', textDecoration:'none', display:'block', marginBottom:4 },
  vendorName: { fontSize:11, color:'#5c5852', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 },
  itemPrice:  { fontSize:13, color:'#9e9890' },
  qtyControl: { display:'flex', alignItems:'center', border:'1px solid #2a2a2a', borderRadius:6, overflow:'hidden' },
  qtyBtn:     { width:32, height:36, background:'#0f0f0f', border:'none', color:'#f5f0eb', fontSize:16, cursor:'pointer' },
  qty:        { width:40, textAlign:'center', fontSize:14, color:'#f5f0eb' },
  lineTotal:  { fontFamily:"'DM Mono',monospace", fontSize:16, color:'#c9a96e', width:100, textAlign:'right' },
  removeBtn:  { background:'none', border:'none', color:'#3a3a3a', fontSize:14, cursor:'pointer', padding:8, transition:'color 0.2s' },
  summary:    { width:320, flexShrink:0, background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, position:'sticky', top:88 },
  summaryTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', marginBottom:20 },
  row:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  label:      { fontSize:13, color:'#5c5852' },
  val:        { fontSize:14, color:'#9e9890', fontFamily:"'DM Mono',monospace" },
  divider:    { height:1, background:'#1a1a1a', margin:'16px 0' },
  secureText: { fontSize:11, color:'#3a3a3a', textAlign:'center', marginTop:12 },

  empty:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center', padding:24 },
  emptyIcon:  { fontSize:64, color:'#1a1a1a', marginBottom:24 },
  emptyTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:'#f5f0eb', marginBottom:12 },
  emptySub:   { fontSize:15, color:'#5c5852' },
};
