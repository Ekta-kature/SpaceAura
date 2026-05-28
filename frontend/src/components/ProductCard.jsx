import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { wishlistApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function Stars({ rating }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#c9a96e' : '#2a2a2a', fontSize: 11 }}>★</span>
      ))}
    </div>
  );
}

// Curated static fallback images — always reliable
const FALLBACK_IMAGES = {
 sofa:        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  armchair:    'https://jlhomedecorin.com/cdn/shop/files/download-2024-04-20T174746.051.jpg?v=1713858587',
  chair:       'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
  table:       'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
  coffeetable: 'https://www.nismaayadecor.in/cdn/shop/files/joren-solid-mango-wood-rattan-coffee-table_1.jpg?v=1717158653',
  bed:         'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80',
  lamp:        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
  shelf:       'https://i.etsystatic.com/48407509/r/il/0aca90/7042961674/il_fullxfull.7042961674_2pbb.jpg',
  rug:         'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80',
  desk:        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
  wardrobe:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  storage:     'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
  bathroom:    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
  kitchen:     'https://kitchendecor.in/wp-content/uploads/2024/01/IMG_1723-scaled-1.jpg',
  outdoor:     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  decor:       'https://images.unsplash.com/photo-1493552832879-45a30f2d2e48?w=800&q=80',
  default:     'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
};

function getFallbackImage(name = '') {
  const n = name.toLowerCase();
  // Lamps & lighting — check pendant/cluster before generic 'light'
  if (n.includes('table lamp') || n.includes('floor lamp') || n.includes('desk lamp') || n.includes('ceiling lamp')) return FALLBACK_IMAGES.lamp;
  if (n.includes('pendant') || n.includes('chandelier') || n.includes('cluster light') || n.includes('sconce') || n.includes('lantern')) return FALLBACK_IMAGES.lamp;
  // Tables — specific types first
  if (n.includes('coffee table') || n.includes('center table') || n.includes('side table')) return FALLBACK_IMAGES.coffeetable;
  if (n.includes('dining table') || n.includes('dining set') || n.includes('marble table') || n.includes('walnut table')) return FALLBACK_IMAGES.table;
  // Kitchen island separately (not a dining table)
  if (n.includes('kitchen island') || n.includes('kitchen') || n.includes('modular kitchen') || n.includes('pantry')) return FALLBACK_IMAGES.kitchen;
  // Beds
  if (n.includes('bed frame') || n.includes('bunk bed') || n.includes('king bed') || n.includes('queen bed') || n.includes('single bed')) return FALLBACK_IMAGES.bed;
  // Chairs — armchair before generic chair
  if (n.includes('armchair') || n.includes('arm chair') || n.includes('accent chair') || n.includes('velvet chair') || n.includes('rocking chair') || n.includes('lounge chair')) return FALLBACK_IMAGES.armchair;
  if (n.includes('office chair') || n.includes('gaming chair') || n.includes('desk chair') || n.includes('dining chair')) return FALLBACK_IMAGES.chair;
  // Shelves
  if (n.includes('bookshelf') || n.includes('bookcase') || n.includes('book shelf') || n.includes('book rack')) return FALLBACK_IMAGES.shelf;
  // Bathroom
  if (n.includes('shower') || n.includes('bathroom') || n.includes('bath') || n.includes('washroom') || n.includes('toilet') || n.includes('basin') || n.includes('vanity')) return FALLBACK_IMAGES.bathroom;
  // Outdoor
  if (n.includes('outdoor') || n.includes('garden') || n.includes('patio') || n.includes('balcony') || n.includes('terrace')) return FALLBACK_IMAGES.outdoor;
  // Single keywords
  if (n.includes('sofa') || n.includes('couch') || n.includes('sectional'))    return FALLBACK_IMAGES.sofa;
  if (n.includes('wardrobe') || n.includes('almirah') || n.includes('closet')) return FALLBACK_IMAGES.wardrobe;
  if (n.includes('lamp') || n.includes('lighting') || n.includes('light'))     return FALLBACK_IMAGES.lamp;
  if (n.includes('desk') || n.includes('workstation') || n.includes('study'))  return FALLBACK_IMAGES.desk;
  if (n.includes('shelf') || n.includes('rack') || n.includes('shelving'))     return FALLBACK_IMAGES.shelf;
  if (n.includes('rug') || n.includes('carpet') || n.includes('mat') || n.includes('jute')) return FALLBACK_IMAGES.rug;
  if (n.includes('storage') || n.includes('cabinet') || n.includes('drawer') || n.includes('chest')) return FALLBACK_IMAGES.storage;
  if (n.includes('bed') || n.includes('mattress') || n.includes('pillow') || n.includes('duvet')) return FALLBACK_IMAGES.bed;
  if (n.includes('table') || n.includes('dining'))  return FALLBACK_IMAGES.table;
  if (n.includes('chair') || n.includes('stool') || n.includes('ottoman') || n.includes('pouf')) return FALLBACK_IMAGES.chair;
  if (n.includes('decor') || n.includes('vase') || n.includes('frame') || n.includes('mirror') || n.includes('candle') || n.includes('cushion')) return FALLBACK_IMAGES.decor;
  return FALLBACK_IMAGES.default;
}

// Always use curated static images — API images are unreliable (wrong photos, broken URLs, etc.)
function resolveImage(product) {
  return getFallbackImage(product.name);
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const staticImg = resolveImage(product);
  const [imgSrc, setImgSrc] = useState(staticImg);

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    setAdding(true);
    try { await addToCart(product.id, 1); } finally { setAdding(false); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    await wishlistApi.toggle(product.id);
    setWishlisted(w => !w);
  };

  return (
    <Link to={`/product/${product.id}`} style={s.card}>
      <div style={s.imgWrap}>
        <img
          src={imgSrc}
          alt={product.name}
          style={s.img}
          loading="lazy"
          onError={() => setImgSrc(getFallbackImage(product.name))}
        />
        {product.badge && <span style={s.badge}>{product.badge}</span>}
        {discount && <span style={s.discount}>-{discount}%</span>}
        <button onClick={handleWishlist} style={{ ...s.wishBtn, color: wishlisted ? '#c9a96e' : '#9e9890' }}>
          {wishlisted ? '♥' : '♡'}
        </button>
        <div style={s.overlay}>
          <button onClick={handleAdd} style={s.addBtn} disabled={adding}>
            {adding ? '...' : 'Add to Cart'}
          </button>
        </div>
      </div>
      <div style={s.body}>
        {product.vendor && (
          <div style={s.vendor}>{product.vendor.businessName}</div>
        )}
        <h3 style={s.name}>{product.name}</h3>
        <div style={s.meta}>
          <Stars rating={product.rating} />
          {product.totalReviews > 0 && <span style={s.reviewCount}>({product.totalReviews})</span>}
        </div>
        <div style={s.pricing}>
          <span style={s.price}>₹{product.price.toLocaleString('en-IN')}</span>
          {product.oldPrice && <span style={s.oldPrice}>₹{product.oldPrice.toLocaleString('en-IN')}</span>}
        </div>
      </div>
    </Link>
  );
}

const s = {
  card:    { display:'block', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, overflow:'hidden', transition:'all 0.25s', textDecoration:'none' },
  imgWrap: { position:'relative', paddingTop:'110%', overflow:'hidden', background:'#0f0f0f' },
  img:     { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease', display:'block' },
  badge:   { position:'absolute', top:12, left:12, background:'#c9a96e', color:'#0a0a0a', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:2 },
  discount:{ position:'absolute', top:12, right:44, background:'#c0392b', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:2 },
  wishBtn: { position:'absolute', top:8, right:8, width:32, height:32, background:'rgba(10,10,10,0.7)', border:'none', borderRadius:'50%', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' },
  overlay: { position:'absolute', bottom:0, left:0, right:0, padding:'32px 16px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.8))', transform:'translateY(100%)', transition:'transform 0.3s ease', display:'flex', alignItems:'flex-end' },
  addBtn:  { width:'100%', background:'#c9a96e', color:'#0a0a0a', border:'none', borderRadius:4, padding:'10px', fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' },
  body:    { padding:'16px' },
  vendor:  { fontSize:10, color:'#5c5852', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 },
  name:    { fontSize:14, color:'#f5f0eb', fontFamily:"'Cormorant Garamond',serif", fontWeight:500, lineHeight:1.3, marginBottom:8 },
  meta:    { display:'flex', alignItems:'center', gap:6, marginBottom:10 },
  reviewCount: { fontSize:11, color:'#5c5852' },
  pricing: { display:'flex', alignItems:'center', gap:10 },
  price:   { fontSize:16, color:'#c9a96e', fontWeight:600, fontFamily:"'DM Mono',monospace" },
  oldPrice:{ fontSize:12, color:'#5c5852', textDecoration:'line-through', fontFamily:"'DM Mono',monospace" },
};

// Hover styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    a[href^="/product/"]:hover { border-color: #2a2a2a !important; transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    a[href^="/product/"]:hover img { transform: scale(1.04); }
    a[href^="/product/"]:hover div[style*="translateY(100%)"] { transform: translateY(0) !important; }
  `;
  document.head.appendChild(style);
}