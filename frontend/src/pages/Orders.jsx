// Orders.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  PENDING:'#9e9890', CONFIRMED:'#3498db', PROCESSING:'#e67e22',
  SHIPPED:'#9b59b6', DELIVERED:'#27ae60', CANCELLED:'#c0392b', REFUNDED:'#f39c12',
};

export function Orders() {
  const { isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sp] = useSearchParams();
  const success = sp.get('success');

  useEffect(() => {
    if (!isLoggedIn) return;
    ordersApi.myOrders().then(({ data }) => setOrders(data.orders || [])).finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding:'48px 24px', maxWidth:900 }}>
      {success && (
        <div style={{ background:'rgba(39,174,96,0.1)', border:'1px solid rgba(39,174,96,0.3)', borderRadius:8, padding:'16px 24px', marginBottom:32, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>🎉</span>
          <div>
            <div style={{ color:'#27ae60', fontWeight:600 }}>Order Placed Successfully!</div>
            <div style={{ color:'#9e9890', fontSize:13, marginTop:2 }}>Order #{success}</div>
          </div>
        </div>
      )}
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, marginBottom:40 }}>My Orders</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:48, color:'#1a1a1a', marginBottom:16 }}>◻</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb', marginBottom:8 }}>No orders yet</h3>
          <p style={{ color:'#5c5852', marginBottom:24 }}>Start shopping to see your orders here.</p>
          <Link to="/shop" className="btn btn-primary">Browse Collection</Link>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:24, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'#c9a96e' }}>{order.orderNumber}</div>
                <div style={{ fontSize:12, color:'#5c5852', marginTop:4 }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</div>
              </div>
              <span style={{ background: STATUS_COLOR[order.status]+'20', color: STATUS_COLOR[order.status], border:`1px solid ${STATUS_COLOR[order.status]}40`, padding:'4px 12px', borderRadius:20, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
                {order.status}
              </span>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {order.items?.slice(0,3).map(item => (
                <div key={item.id} style={{ fontSize:13, color:'#9e9890' }}>
                  {item.name} × {item.qty}
                  {order.items.length > 3 && ' ...'}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #1a1a1a' }}>
              <div style={{ fontSize:12, color:'#5c5852' }}>{order.deliveryType} delivery</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, color:'#c9a96e' }}>₹{order.total.toLocaleString('en-IN')}</div>
            </div>
            {['PENDING','CONFIRMED'].includes(order.status) && (
              <button className="btn btn-danger btn-sm" style={{ marginTop:12 }}
                onClick={async () => {
                  if (confirm('Cancel this order?')) {
                    await ordersApi.cancel(order.id);
                    setOrders(prev => prev.map(o => o.id===order.id ? {...o, status:'CANCELLED'} : o));
                  }
                }}>
                Cancel Order
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;
