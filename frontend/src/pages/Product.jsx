import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi, reviewsApi } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { wishlistApi } from '../lib/api';

// Static curated images for product pages — never rely on broken API URLs
const STATIC_PRODUCT_IMAGES = {
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

function getStaticProductImage(name = '') {
  const n = name.toLowerCase();
  // Lamps & lighting — check pendant/cluster before generic 'light'
  if (n.includes('table lamp') || n.includes('floor lamp') || n.includes('desk lamp') || n.includes('ceiling lamp')) return STATIC_PRODUCT_IMAGES.lamp;
  if (n.includes('pendant') || n.includes('chandelier') || n.includes('cluster light') || n.includes('sconce') || n.includes('lantern')) return STATIC_PRODUCT_IMAGES.lamp;
  // Tables — specific types first
  if (n.includes('coffee table') || n.includes('center table') || n.includes('side table')) return STATIC_PRODUCT_IMAGES.coffeetable;
  if (n.includes('dining table') || n.includes('dining set') || n.includes('marble table') || n.includes('walnut table')) return STATIC_PRODUCT_IMAGES.table;
  // Kitchen island separately (not a dining table)
  if (n.includes('kitchen island') || n.includes('kitchen') || n.includes('modular kitchen') || n.includes('pantry')) return STATIC_PRODUCT_IMAGES.kitchen;
  // Beds
  if (n.includes('bed frame') || n.includes('bunk bed') || n.includes('king bed') || n.includes('queen bed') || n.includes('single bed')) return STATIC_PRODUCT_IMAGES.bed;
  // Chairs — armchair before generic chair
  if (n.includes('armchair') || n.includes('arm chair') || n.includes('accent chair') || n.includes('velvet chair') || n.includes('rocking chair') || n.includes('lounge chair')) return STATIC_PRODUCT_IMAGES.armchair;
  if (n.includes('office chair') || n.includes('gaming chair') || n.includes('desk chair') || n.includes('dining chair')) return STATIC_PRODUCT_IMAGES.chair;
  // Shelves
  if (n.includes('bookshelf') || n.includes('bookcase') || n.includes('book shelf') || n.includes('book rack')) return STATIC_PRODUCT_IMAGES.shelf;
  // Bathroom
  if (n.includes('shower') || n.includes('bathroom') || n.includes('bath') || n.includes('washroom') || n.includes('toilet') || n.includes('basin') || n.includes('vanity')) return STATIC_PRODUCT_IMAGES.bathroom;
  // Outdoor
  if (n.includes('outdoor') || n.includes('garden') || n.includes('patio') || n.includes('balcony') || n.includes('terrace')) return STATIC_PRODUCT_IMAGES.outdoor;
  // Single keywords
  if (n.includes('sofa') || n.includes('couch') || n.includes('sectional'))    return STATIC_PRODUCT_IMAGES.sofa;
  if (n.includes('wardrobe') || n.includes('almirah') || n.includes('closet')) return STATIC_PRODUCT_IMAGES.wardrobe;
  if (n.includes('lamp') || n.includes('lighting') || n.includes('light'))     return STATIC_PRODUCT_IMAGES.lamp;
  if (n.includes('desk') || n.includes('workstation') || n.includes('study'))  return STATIC_PRODUCT_IMAGES.desk;
  if (n.includes('shelf') || n.includes('rack') || n.includes('shelving'))     return STATIC_PRODUCT_IMAGES.shelf;
  if (n.includes('rug') || n.includes('carpet') || n.includes('mat') || n.includes('jute')) return STATIC_PRODUCT_IMAGES.rug;
  if (n.includes('storage') || n.includes('cabinet') || n.includes('drawer') || n.includes('chest')) return STATIC_PRODUCT_IMAGES.storage;
  if (n.includes('bed') || n.includes('mattress') || n.includes('pillow') || n.includes('duvet')) return STATIC_PRODUCT_IMAGES.bed;
  if (n.includes('table') || n.includes('dining'))  return STATIC_PRODUCT_IMAGES.table;
  if (n.includes('chair') || n.includes('stool') || n.includes('ottoman') || n.includes('pouf')) return STATIC_PRODUCT_IMAGES.chair;
  if (n.includes('decor') || n.includes('vase') || n.includes('frame') || n.includes('mirror') || n.includes('candle') || n.includes('cushion')) return STATIC_PRODUCT_IMAGES.decor;
  return STATIC_PRODUCT_IMAGES.default;
}

// Always use static images — API images are unreliable (can be wrong photos, broken URLs, etc.)
function resolveImages(product) {
  return [{ url: getStaticProductImage(product.name) }];
}

// Always use static image for related products too
function resolveRelatedImage(p) {
  return getStaticProductImage(p.name);
}

function Stars({ rating, size=14, interactive=false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          style={{ fontSize:size, color: i<=(interactive?hover||rating:rating) ? '#c9a96e' : '#2a2a2a', cursor: interactive?'pointer':'default', transition:'color 0.1s' }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange && onChange(i)}
        >★</span>
      ))}
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding]     = useState(false);

  // Review form
  const [reviewForm, setReviewForm] = useState({ rating:0, title:'', comment:'' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi.get(id)
      .then(({ data }) => {
        setProduct(data.product);
        setReviews(data.product.reviews || []);
      })
      .finally(() => setLoading(false));
    productsApi.related(id).then(({ data }) => setRelated(data.products || []));
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!product) return <div className="page-loader"><p style={{ color:'#5c5852' }}>Product not found.</p></div>;

  const images = resolveImages(product);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate('/login?redirect=/product/'+id); return; }
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    await wishlistApi.toggle(product.id);
    setWishlisted(w => !w);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return;
    setSubmittingReview(true);
    try {
      const { data } = await reviewsApi.create({ productId: product.id, ...reviewForm });
      setReviews(r => [data.review, ...r]);
      setReviewDone(true);
      setReviewForm({ rating:0, title:'', comment:'' });
    } catch {}
    setSubmittingReview(false);
  };

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/shop" style={s.breadcrumbLink}>Shop</Link>
        <span style={s.breadcrumbSep}>›</span>
        <span style={s.breadcrumbCurrent}>{product.name}</span>
      </div>

      {/* Main Product Layout */}
      <div style={s.layout}>
        {/* Images */}
        <div style={s.imageSection}>
          <div style={s.mainImgWrap}>
            <img src={images[activeImg].url} alt={product.name} style={s.mainImg} onError={e => { e.target.src = getStaticProductImage(product.name); }} />
            {product.badge && <span style={s.badge}>{product.badge}</span>}
            {discount && <span style={s.discountBadge}>-{discount}%</span>}
          </div>
          {images.length > 1 && (
            <div style={s.thumbs}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ ...s.thumb, ...(i===activeImg ? s.thumbActive : {}) }}>
                  <img src={img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={s.infoSection}>
          {product.vendor && (
            <Link to={`/vendors/${product.vendor.id}`} style={s.vendorLink}>
              {product.vendor.businessName}
              {product.vendor.isVerified && <span style={s.verified}>✓ Verified</span>}
            </Link>
          )}
          <h1 style={s.name}>{product.name}</h1>
          <div style={s.ratingRow}>
            <Stars rating={product.rating} />
            <span style={s.ratingText}>{product.rating.toFixed(1)} ({product.totalReviews} reviews)</span>
          </div>

          <div style={s.pricing}>
            <span style={s.price}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.oldPrice && <span style={s.oldPrice}>₹{product.oldPrice.toLocaleString('en-IN')}</span>}
            {discount && <span style={s.saving}>Save {discount}%</span>}
          </div>

          <div style={s.divider} />

          <p style={s.description}>{product.description}</p>

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div style={s.specs}>
              {Object.entries(product.specs).map(([k,v]) => (
                <div key={k} style={s.spec}>
                  <span style={s.specKey}>{k}</span>
                  <span style={s.specVal}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Qty + Add */}
          <div style={s.actions}>
            <div style={s.qtyWrap}>
              <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1,q-1))}>−</button>
              <span style={s.qtyNum}>{qty}</span>
              <button style={s.qtyBtn} onClick={() => setQty(q => q+1)}>+</button>
            </div>
            <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={handleAddToCart} disabled={adding}>
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button onClick={handleWishlist} style={{ ...s.wishBtn, color: wishlisted?'#c9a96e':'#9e9890' }}>
              {wishlisted ? '♥' : '♡'}
            </button>
          </div>

          {/* Info chips */}
          <div style={s.chips}>
            {[['🚚','Free delivery above ₹5,000'],['↩','30-day returns'],['🔒','Secure payment']].map(([icon,txt]) => (
              <div key={txt} style={s.chip}>
                <span>{icon}</span>
                <span style={s.chipText}>{txt}</span>
              </div>
            ))}
          </div>

          {product.vendor && (
            <Link to={`/vendors/${product.vendor.id}`} className="btn btn-outline" style={{ marginTop:16, justifyContent:'center' }}>
              Chat with Designer
            </Link>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={s.reviewSection}>
        <h2 style={s.reviewTitle}>Customer Reviews</h2>
        <div style={s.reviewLayout}>
          {/* Write Review */}
          <div style={s.reviewForm}>
            <h3 style={s.reviewFormTitle}>Write a Review</h3>
            {!isLoggedIn ? (
              <p style={{ color:'#5c5852', fontSize:14 }}>
                <Link to="/login" style={{ color:'#c9a96e' }}>Sign in</Link> to write a review.
              </p>
            ) : reviewDone ? (
              <p style={{ color:'var(--green)', fontSize:14 }}>✓ Thank you for your review!</p>
            ) : (
              <form onSubmit={handleReview} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group">
                  <label className="form-label">Your Rating *</label>
                  <Stars rating={reviewForm.rating} size={24} interactive onChange={r => setReviewForm(f=>({...f,rating:r}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={reviewForm.title} onChange={e=>setReviewForm(f=>({...f,title:e.target.value}))} placeholder="Summarize your experience" />
                </div>
                <div className="form-group">
                  <label className="form-label">Review *</label>
                  <textarea className="form-input" rows={4} required value={reviewForm.comment} onChange={e=>setReviewForm(f=>({...f,comment:e.target.value}))} placeholder="Share your thoughts..." style={{ resize:'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={!reviewForm.rating || submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

          {/* Review List */}
          <div style={{ flex:1 }}>
            {reviews.length === 0
              ? <p style={{ color:'#5c5852', fontSize:14 }}>No reviews yet. Be the first!</p>
              : reviews.map(r => (
                <div key={r.id} style={s.review}>
                  <div style={s.reviewHeader}>
                    <div style={s.reviewAvatar}>
                      {r.user.avatar
                        ? <img src={r.user.avatar} alt={r.user.name} style={s.reviewAvatarImg} />
                        : <span style={s.reviewAvatarFallback}>{r.user.name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <div style={s.reviewerName}>{r.user.name}</div>
                      <Stars rating={r.rating} size={12} />
                    </div>
                    <span style={s.reviewDate}>{new Date(r.createdAt).toLocaleDateString('en-IN',{ year:'numeric',month:'short',day:'numeric' })}</span>
                  </div>
                  {r.title && <p style={s.reviewItemTitle}>{r.title}</p>}
                  <p style={s.reviewComment}>{r.comment}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div style={{ marginTop:80 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:'#f5f0eb', marginBottom:32 }}>You Might Also Like</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {related.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} style={{ display:'block', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, overflow:'hidden', textDecoration:'none' }}>
                <img src={resolveRelatedImage(p)} alt={p.name} style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover' }} />
                <div style={{ padding:16 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:'#f5f0eb' }}>{p.name}</p>
                  <p style={{ color:'#c9a96e', fontFamily:"'DM Mono',monospace", fontSize:14, marginTop:6 }}>₹{p.price.toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  breadcrumb:      { display:'flex', gap:8, alignItems:'center', marginBottom:32, fontSize:13, color:'#5c5852' },
  breadcrumbLink:  { color:'#9e9890', textDecoration:'none' },
  breadcrumbSep:   { color:'#3a3a3a' },
  breadcrumbCurrent: { color:'#9e9890' },

  layout:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, marginBottom:80 },
  imageSection:{ display:'flex', flexDirection:'column', gap:12 },
  mainImgWrap: { position:'relative', aspectRatio:'1/1', borderRadius:8, overflow:'hidden', background:'#0f0f0f' },
  mainImg:     { width:'100%', height:'100%', objectFit:'cover' },
  badge:       { position:'absolute', top:16, left:16, background:'#c9a96e', color:'#0a0a0a', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 10px', borderRadius:2 },
  discountBadge: { position:'absolute', top:16, right:16, background:'#c0392b', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:2 },
  thumbs:      { display:'flex', gap:8 },
  thumb:       { width:72, height:72, borderRadius:4, overflow:'hidden', border:'1px solid #2a2a2a', cursor:'pointer', flexShrink:0 },
  thumbActive: { borderColor:'#c9a96e' },

  infoSection: { display:'flex', flexDirection:'column', gap:0 },
  vendorLink:  { fontSize:12, color:'#5c5852', letterSpacing:'0.08em', textTransform:'uppercase', textDecoration:'none', display:'flex', alignItems:'center', gap:8, marginBottom:12 },
  verified:    { background:'rgba(39,174,96,0.1)', color:'var(--green)', fontSize:10, padding:'2px 8px', borderRadius:10, border:'1px solid rgba(39,174,96,0.2)' },
  name:        { fontFamily:"'Cormorant Garamond',serif", fontSize:38, color:'#f5f0eb', fontWeight:400, lineHeight:1.2, marginBottom:16 },
  ratingRow:   { display:'flex', alignItems:'center', gap:10, marginBottom:24 },
  ratingText:  { fontSize:13, color:'#5c5852' },
  pricing:     { display:'flex', alignItems:'center', gap:16, marginBottom:24 },
  price:       { fontFamily:"'DM Mono',monospace", fontSize:32, color:'#c9a96e', fontWeight:500 },
  oldPrice:    { fontFamily:"'DM Mono',monospace", fontSize:18, color:'#3a3a3a', textDecoration:'line-through' },
  saving:      { fontSize:12, background:'rgba(201,169,110,0.1)', color:'#c9a96e', padding:'4px 10px', borderRadius:10, border:'1px solid rgba(201,169,110,0.2)' },
  divider:     { height:1, background:'#1a1a1a', margin:'24px 0' },
  description: { fontSize:15, color:'#9e9890', lineHeight:1.8, marginBottom:24 },
  specs:       { display:'flex', flexDirection:'column', gap:8, marginBottom:24, background:'#0f0f0f', borderRadius:8, padding:20 },
  spec:        { display:'flex', justifyContent:'space-between', fontSize:13 },
  specKey:     { color:'#5c5852', textTransform:'capitalize' },
  specVal:     { color:'#f5f0eb' },

  actions:     { display:'flex', gap:12, marginBottom:20, alignItems:'center' },
  qtyWrap:     { display:'flex', alignItems:'center', border:'1px solid #2a2a2a', borderRadius:6, overflow:'hidden' },
  qtyBtn:      { width:36, height:44, background:'#0f0f0f', border:'none', color:'#f5f0eb', fontSize:18, cursor:'pointer' },
  qtyNum:      { width:40, textAlign:'center', fontSize:15, color:'#f5f0eb' },
  wishBtn:     { width:44, height:44, background:'#111', border:'1px solid #2a2a2a', borderRadius:6, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  chips:       { display:'flex', flexDirection:'column', gap:10, background:'#0f0f0f', borderRadius:8, padding:16, marginTop:8 },
  chip:        { display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#9e9890' },
  chipText:    {},

  reviewSection:   { borderTop:'1px solid #1a1a1a', paddingTop:64 },
  reviewTitle:     { fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:'#f5f0eb', marginBottom:40 },
  reviewLayout:    { display:'grid', gridTemplateColumns:'360px 1fr', gap:64 },
  reviewForm:      { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:32 },
  reviewFormTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', marginBottom:20 },
  review:          { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:24, marginBottom:16 },
  reviewHeader:    { display:'flex', alignItems:'center', gap:12, marginBottom:12 },
  reviewAvatar:    { width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  reviewAvatarImg: { width:'100%', height:'100%', objectFit:'cover' },
  reviewAvatarFallback: { fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#c9a96e' },
  reviewerName:    { fontSize:14, color:'#f5f0eb', marginBottom:4 },
  reviewDate:      { marginLeft:'auto', fontSize:12, color:'#3a3a3a' },
  reviewItemTitle: { fontSize:15, color:'#f5f0eb', fontWeight:500, marginBottom:8 },
  reviewComment:   { fontSize:14, color:'#9e9890', lineHeight:1.7 },
};