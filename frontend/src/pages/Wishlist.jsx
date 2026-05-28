// Wishlist.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistApi, cartApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Wishlist() {
  const { isLoggedIn } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login?redirect=/wishlist'); return; }
    wishlistApi.get().then(({ data }) => setItems(data.items || [])).finally(() => setLoading(false));
  }, [isLoggedIn]);

  const remove = async (productId) => {
    await wishlistApi.toggle(productId);
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const moveToCart = async (productId) => {
    await cartApi.add(productId, 1);
    await wishlistApi.toggle(productId);
    setItems(prev => prev.filter(i => i.productId !== productId));
    fetchCart();
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, marginBottom:40 }}>Wishlist</h1>
      {items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:48, color:'#1a1a1a', marginBottom:16 }}>♡</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb', marginBottom:8 }}>Your wishlist is empty</h3>
          <p style={{ color:'#5c5852', marginBottom:24 }}>Save items you love for later.</p>
          <Link to="/shop" className="btn btn-primary">Browse Collection</Link>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {items.map(item => {
            const p = item.product;
            return (
              <div key={item.id} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:8, overflow:'hidden' }}>
                <Link to={`/product/${item.productId}`}>
                  <img src={p?.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'} alt={p?.name} style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover' }} />
                </Link>
                <div style={{ padding:16 }}>
                  <Link to={`/product/${item.productId}`} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:'#f5f0eb', textDecoration:'none', display:'block', marginBottom:4 }}>{p?.name}</Link>
                  <div style={{ fontFamily:"'DM Mono',monospace", color:'#c9a96e', fontSize:14, marginBottom:12 }}>₹{p?.price?.toLocaleString('en-IN')}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => moveToCart(item.productId)}>Add to Cart</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(item.productId)}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
