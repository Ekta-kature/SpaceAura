// Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersApi, wishlistApi } from '../lib/api';

export function Dashboard() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    Promise.all([
      ordersApi.myOrders(),
      wishlistApi.get(),
    ]).then(([o, w]) => {
      setOrders(o.data.orders?.slice(0,3) || []);
      setWishlist(w.data.items?.slice(0,4) || []);
    }).finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      <div style={{ marginBottom:40 }}>
        <p style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:8 }}>Welcome back</p>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, color:'#f5f0eb', fontWeight:400 }}>{user?.name}</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:48 }}>
        {[
          ['/shop', '◈', 'Shop Collection', 'Browse curated furniture'],
          ['/vendors', '◎', 'Find Designers', 'Connect with top designers'],
          ['/orders', '◻', 'My Orders', `${orders.length} recent orders`],
        ].map(([path, icon, title, sub]) => (
          <Link key={path} to={path} style={{ display:'block', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, textDecoration:'none', transition:'border-color 0.2s' }}>
            <div style={{ fontSize:32, color:'#c9a96e', marginBottom:16 }}>{icon}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#f5f0eb', marginBottom:4 }}>{title}</div>
            <div style={{ fontSize:13, color:'#5c5852' }}>{sub}</div>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <div style={{ marginBottom:48 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb' }}>Recent Orders</h2>
            <Link to="/orders" style={{ fontSize:13, color:'#c9a96e', textDecoration:'none' }}>View all →</Link>
          </div>
          {orders.map(o => (
            <div key={o.id} style={{ display:'flex', justifyContent:'space-between', padding:'16px 20px', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'#c9a96e' }}>{o.orderNumber}</div>
                <div style={{ fontSize:12, color:'#5c5852', marginTop:2 }}>{o.items?.length} item(s) · {o.status}</div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", color:'#f5f0eb' }}>₹{o.total?.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}

      {wishlist.length > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb' }}>Wishlist</h2>
            <Link to="/wishlist" style={{ fontSize:13, color:'#c9a96e', textDecoration:'none' }}>View all →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {wishlist.map(item => (
              <Link key={item.id} to={`/product/${item.productId}`} style={{ display:'block', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, overflow:'hidden', textDecoration:'none' }}>
                <img src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300'} alt={item.product?.name} style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover' }} />
                <div style={{ padding:12 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, color:'#f5f0eb', marginBottom:4 }}>{item.product?.name}</p>
                  <p style={{ color:'#c9a96e', fontFamily:"'DM Mono',monospace", fontSize:13 }}>₹{item.product?.price?.toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
