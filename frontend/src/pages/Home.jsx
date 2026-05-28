import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../lib/api';
import ProductCard from '../components/ProductCard';

function HeroSection() {
  return (
    <section style={s.hero}>
      <div style={s.heroBg}>
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80"
          alt="Interior"
          style={s.heroBgImg}
        />
        <div style={s.heroBgOverlay} />
      </div>
      <div style={s.heroContent}>
        <p style={s.heroEyebrow}>✦ Curated Interior Design</p>
        <h1 style={s.heroTitle}>
          Your space,<br />
          <em>reimagined.</em>
        </h1>
        <p style={s.heroSub}>
          Discover handpicked furniture and connect with India's finest interior designers — all in one place.
        </p>
        <div style={s.heroBtns}>
          <Link to="/shop" className="btn btn-primary btn-lg">Shop Collection</Link>
          <Link to="/vendors" className="btn btn-outline btn-lg">Find a Designer</Link>
        </div>
        <div style={s.heroStats}>
          {[['2,400+','Products'],['340+','Designers'],['18,000+','Happy Homes']].map(([n,l]) => (
            <div key={l} style={s.heroStat}>
              <span style={s.heroStatNum}>{n}</span>
              <span style={s.heroStatLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Static curated images for categories — always reliable, ignores broken API images
const CATEGORY_IMAGES = {
  'living room':  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  'bedroom':      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
  'beds':         'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
  'mattress':     'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
  'dining sets':  'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
  'dining':       'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
  'kitchen':      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  'bathroom':     'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80',
  'office':       'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
  'outdoor':      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  'kids':         'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80',
  'sofa':         'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  'chair':        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80',
  'table':        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80',
  'bed':          'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
  'lighting':     'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  'lamp':         'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  'light':        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  'shelf':        'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80',
  'rug':          'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&q=80',
  'decor':        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
  'wardrobe':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'storage':      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80',
  'curtain':      'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
  'default':      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
};

function getCategoryImage(name = '') {
  // Always use static images — never trust API-provided images
  const lower = name.toLowerCase();
  // Check longer/more specific phrases first to avoid partial mismatches
  const keys = Object.keys(CATEGORY_IMAGES).filter(k => k !== 'default').sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) return CATEGORY_IMAGES[key];
  }
  return CATEGORY_IMAGES.default;
}

// Static fallback categories — shown when API returns empty or while loading
const STATIC_CATEGORIES = [
  { id: 'living-room', name: 'Living Room', slug: 'living-room', _count: { products: 0 } },
  { id: 'bedroom',     name: 'Bedroom',     slug: 'bedroom',     _count: { products: 0 } },
  { id: 'dining',      name: 'Dining',      slug: 'dining',       _count: { products: 0 } },
  { id: 'office',      name: 'Home Office', slug: 'office',       _count: { products: 0 } },
  { id: 'decor',       name: 'Decor',       slug: 'decor',        _count: { products: 0 } },
  { id: 'storage',     name: 'Storage',     slug: 'storage',      _count: { products: 0 } },
  { id: 'outdoor',     name: 'Outdoor',     slug: 'outdoor',      _count: { products: 0 } },
  { id: 'kids',        name: 'Kids Room',   slug: 'kids',         _count: { products: 0 } },
];

function CategoriesSection({ categories }) {
  // Merge API categories with static ones — use API data if available, else show statics
  const display = categories.length > 0 ? categories.slice(0, 8) : STATIC_CATEGORIES;
  return (
    <section style={s.section}>
      <div className="container">
        <div style={s.sectionHeader}>
          <p style={s.eyebrow}>Shop by Room</p>
          <h2 style={s.sectionTitle}>Browse Categories</h2>
        </div>
        <div style={s.catGrid}>
          {display.map(cat => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} style={s.catCard}>
              <div style={s.catImgWrap}>
                <img
                  src={getCategoryImage(cat.name)}
                  alt={cat.name}
                  style={s.catImg}
                  onError={e => { e.target.src = CATEGORY_IMAGES.default; }}
                />
                <div style={s.catOverlay} />
              </div>
              <div style={s.catBody}>
                <h3 style={s.catName}>{cat.name}</h3>
                {cat._count?.products > 0 && (
                  <span style={s.catCount}>{cat._count.products} products</span>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <Link to="/shop" className="btn btn-outline">View All Categories</Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({ products }) {
  if (!products.length) return (
    <section style={s.section}>
      <div className="container" style={{ textAlign:'center', padding:'80px 24px' }}>
        <p style={s.eyebrow}>Products</p>
        <h2 style={{ ...s.sectionTitle, marginBottom:16 }}>No products yet</h2>
        <p style={{ color:'var(--text2)', marginBottom:32 }}>Vendors haven't added products yet. Be the first!</p>
        <Link to="/vendor-register" className="btn btn-primary">Register as Vendor</Link>
      </div>
    </section>
  );

  return (
    <section style={s.section}>
      <div className="container">
        <div style={s.sectionHeader}>
          <p style={s.eyebrow}>Featured</p>
          <h2 style={s.sectionTitle}>New Arrivals</h2>
        </div>
        <div style={s.prodGrid}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <Link to="/shop" className="btn btn-outline">View All Products</Link>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const items = [
    { icon:'✦', title:'Curated Quality', desc:'Every product is handpicked for quality, aesthetics, and durability.' },
    { icon:'◈', title:'Verified Designers', desc:'All vendors go through a rigorous verification process.' },
    { icon:'◎', title:'Real-time Chat', desc:'Message designers directly and track your project live.' },
    { icon:'⬡', title:'Secure Payments', desc:'Razorpay-powered checkout with full buyer protection.' },
  ];
  return (
    <section style={{ ...s.section, background:'#0d0d0d', borderTop:'1px solid #1a1a1a', borderBottom:'1px solid #1a1a1a' }}>
      <div className="container">
        <div style={s.sectionHeader}>
          <p style={s.eyebrow}>Why SpaceAura</p>
          <h2 style={s.sectionTitle}>Designed for discerning homes</h2>
        </div>
        <div style={s.whyGrid}>
          {items.map(item => (
            <div key={item.title} style={s.whyCard}>
              <div style={s.whyIcon}>{item.icon}</div>
              <h3 style={s.whyTitle}>{item.title}</h3>
              <p style={s.whyDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DesignerCTASection() {
  return (
    <section style={s.section}>
      <div className="container">
        <div style={s.cta}>
          <div style={s.ctaText}>
            <p style={s.eyebrow}>For Designers</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:400, color:'#f5f0eb', lineHeight:1.2, marginBottom:16 }}>
              Grow your design<br />business with us.
            </h2>
            <p style={{ color:'#5c5852', fontSize:15, lineHeight:1.7, marginBottom:32, maxWidth:420 }}>
              Join SpaceAura's curated marketplace. Showcase your portfolio, receive client leads, and manage projects — all from one dashboard.
            </p>
            <Link to="/vendor-register" className="btn btn-primary btn-lg">Apply as a Designer</Link>
          </div>
          <div style={s.ctaImg}>
            <img
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80"
              alt="Designer"
              style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12, filter:'brightness(0.8)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [prodLoading, setProdLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setCatLoading(false));

    productsApi.list({ limit: 8, sort: 'createdAt', order: 'desc' })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setProdLoading(false));
  }, []);

  return (
    <div>
      <HeroSection />
      {catLoading
        ? <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>
        : <CategoriesSection categories={categories} />
      }
      <WhySection />
      {prodLoading
        ? <div style={{ height:400, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>
        : <FeaturedProducts products={products} />
      }
      <DesignerCTASection />
    </div>
  );
}

const s = {
  hero:         { position:'relative', height:'92vh', minHeight:600, display:'flex', alignItems:'center', overflow:'hidden' },
  heroBg:       { position:'absolute', inset:0 },
  heroBgImg:    { width:'100%', height:'100%', objectFit:'cover' },
  heroBgOverlay:{ position:'absolute', inset:0, background:'linear-gradient(105deg,rgba(10,10,10,0.92) 40%,rgba(10,10,10,0.4) 100%)' },
  heroContent:  { position:'relative', zIndex:1, maxWidth:1280, margin:'0 auto', padding:'0 24px', width:'100%' },
  heroEyebrow:  { fontSize:12, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:20 },
  heroTitle:    { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(52px,7vw,96px)', fontWeight:300, color:'#f5f0eb', lineHeight:1.05, marginBottom:24 },
  heroSub:      { fontSize:17, color:'#9e9890', lineHeight:1.7, maxWidth:480, marginBottom:40 },
  heroBtns:     { display:'flex', gap:16, marginBottom:64, flexWrap:'wrap' },
  heroStats:    { display:'flex', gap:48 },
  heroStat:     { display:'flex', flexDirection:'column', gap:4 },
  heroStatNum:  { fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:'#f5f0eb', fontWeight:400 },
  heroStatLabel:{ fontSize:11, color:'#5c5852', letterSpacing:'0.1em', textTransform:'uppercase' },

  section:      { padding:'96px 0' },
  sectionHeader:{ textAlign:'center', marginBottom:56 },
  eyebrow:      { fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:12 },
  sectionTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400 },

  catGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  catCard: { display:'block', textDecoration:'none', borderRadius:8, overflow:'hidden', border:'1px solid #1a1a1a', transition:'all 0.25s', background:'#111' },
  catImgWrap:   { position:'relative', paddingTop:'80%', overflow:'hidden' },
  catImg:       { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s', display:'block' },
  catOverlay:   { position:'absolute', inset:0, background:'linear-gradient(transparent 50%,rgba(0,0,0,0.7))' },
  catBody:      { padding:'16px' },
  catName:      { fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:'#f5f0eb', marginBottom:4 },
  catCount:     { fontSize:11, color:'#5c5852', letterSpacing:'0.08em' },

  prodGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 },

  whyGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32 },
  whyCard: { textAlign:'center', padding:'40px 24px', border:'1px solid #1a1a1a', borderRadius:8, background:'#0a0a0a' },
  whyIcon: { fontSize:28, color:'#c9a96e', marginBottom:20 },
  whyTitle:{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', marginBottom:12 },
  whyDesc: { fontSize:14, color:'#5c5852', lineHeight:1.7 },

  cta: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' },
  ctaText: {},
  ctaImg:  { height:480, borderRadius:12, overflow:'hidden' },
};
