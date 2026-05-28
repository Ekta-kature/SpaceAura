import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorsApi } from '../lib/api';

function Stars({ rating }) {
  return (
    <span style={{ color:'#c9a96e', fontSize:12 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5-Math.round(rating))}
    </span>
  );
}

function VendorCard({ vendor }) {
  const user = vendor.user || {};
  // Profile photo: use avatar, fixed with object-fit cover — no cut-off
  const avatarUrl = user.avatar;
  const coverUrl  = vendor.coverImage || vendor.portfolioImages?.[0]?.url;

  return (
    <Link to={`/vendors/${vendor.id}`} style={s.card}>
      {/* Cover image */}
      <div style={s.cover}>
        {coverUrl
          ? <img src={coverUrl} alt={vendor.businessName} style={s.coverImg} />
          : <div style={s.coverPlaceholder}><span style={s.coverPlaceholderIcon}>◈</span></div>
        }
        {vendor.isVerified && <span style={s.verifiedBadge}>✓ Verified</span>}
      </div>

      {/* Avatar — properly contained, no cropping */}
      <div style={s.avatarWrap}>
        {avatarUrl
          ? <img src={avatarUrl} alt={user.name} style={s.avatar} />
          : <div style={s.avatarFallback}>{user.name?.[0]?.toUpperCase() || '?'}</div>
        }
      </div>

      <div style={s.body}>
        <h3 style={s.bizName}>{vendor.businessName}</h3>
        <p style={s.designerName}>{user.name}</p>
        <p style={s.specialty}>{vendor.specialty}</p>
        <div style={s.meta}>
          <Stars rating={vendor.rating} />
          <span style={s.metaText}>{vendor.rating.toFixed(1)} ({vendor.totalReviews})</span>
        </div>
        <div style={s.chips}>
          <span style={s.chip}>{vendor.experience}y exp</span>
          <span style={s.chip}>{vendor.location}</span>
          <span style={s.chip}>₹{vendor.consultationFee?.toLocaleString('en-IN')}</span>
        </div>
        {vendor.styles?.length > 0 && (
          <div style={s.styles}>
            {vendor.styles.slice(0,3).map(style => (
              <span key={style} style={s.styleTag}>{style}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Vendors() {
  const [vendors, setVendors]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({
    search:'', city:'', specialty:'', sort:'rating', verified:'', fee:'',
  });

  useEffect(() => {
    setLoading(true);
    const params = { page, limit:12, ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    vendorsApi.list(params)
      .then(({ data }) => {
        setVendors(data.vendors || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const setF = (k,v) => { setFilters(f=>({...f,[k]:v})); setPage(1); };

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Interior Designers</p>
          <h1 style={s.pageTitle}>Find Your Perfect Designer</h1>
          <p style={s.pageDesc}>{total} verified designers across India</p>
        </div>
        <Link to="/vendor-register" className="btn btn-outline">Join as a Designer</Link>
      </div>

      {/* Filters */}
      <div style={s.filterBar}>
        <div style={{ position:'relative', flex:1, maxWidth:300 }}>
          <input className="form-input" placeholder="Search by name, city, specialty..." value={filters.search} onChange={e=>setF('search',e.target.value)} style={{ paddingLeft:40 }} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c5852" strokeWidth="1.5" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <input className="form-input" placeholder="City" value={filters.city} onChange={e=>setF('city',e.target.value)} style={{ width:140 }} />
        <input className="form-input" placeholder="Specialty" value={filters.specialty} onChange={e=>setF('specialty',e.target.value)} style={{ width:160 }} />
        <select className="form-input form-select" value={filters.fee} onChange={e=>setF('fee',e.target.value)} style={{ width:160 }}>
          <option value="">All budgets</option>
          <option value="under3k">Under ₹3,000</option>
          <option value="3k-5k">₹3,000 – ₹5,000</option>
          <option value="over5k">₹5,000+</option>
        </select>
        <select className="form-input form-select" value={filters.sort} onChange={e=>setF('sort',e.target.value)} style={{ width:160 }}>
          <option value="rating">Top Rated</option>
          <option value="projects">Most Projects</option>
          <option value="fee-low">Fee: Low to High</option>
          <option value="fee-high">Fee: High to Low</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#9e9890', cursor:'pointer', whiteSpace:'nowrap' }}>
          <input type="checkbox" checked={filters.verified==='true'} onChange={e=>setF('verified',e.target.checked?'true':'')} style={{ accentColor:'#c9a96e' }} />
          Verified only
        </label>
      </div>

      {/* Results */}
      {loading ? (
        <div style={s.grid}>
          {[...Array(6)].map((_,i) => <div key={i} style={s.skeleton} />)}
        </div>
      ) : vendors.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>◎</div>
          <h3 style={s.emptyTitle}>No designers found</h3>
          <p style={s.emptySub}>
            {total === 0
              ? 'No designers have registered yet. Be the first!'
              : 'Try adjusting your filters.'
            }
          </p>
          <Link to="/vendor-register" className="btn btn-primary" style={{ marginTop:24 }}>Register as a Designer</Link>
        </div>
      ) : (
        <>
          <div style={s.grid}>
            {vendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
          {pages > 1 && (
            <div style={s.pagination}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Previous</button>
              <span style={{ fontSize:13, color:'#5c5852' }}>Page {page} of {pages}</span>
              <button className="btn btn-outline btn-sm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, gap:24, flexWrap:'wrap' },
  eyebrow:   { fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:8 },
  pageTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400 },
  pageDesc:  { fontSize:14, color:'#5c5852', marginTop:4 },
  filterBar: { display:'flex', gap:12, flexWrap:'wrap', marginBottom:40, alignItems:'center' },

  grid:     { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 },
  skeleton: { height:440, background:'#111', borderRadius:8, border:'1px solid #1a1a1a' },

  card: {
    display:'block', textDecoration:'none',
    background:'#111', border:'1px solid #1a1a1a', borderRadius:8, overflow:'hidden',
    transition:'all 0.25s',
  },
  cover:      { position:'relative', height:200, overflow:'hidden', background:'#0f0f0f' },
  coverImg:   { width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' },
  coverPlaceholder: { width:'100%', height:'100%', background:'linear-gradient(135deg,#1a1a1a,#0f0f0f)', display:'flex', alignItems:'center', justifyContent:'center' },
  coverPlaceholderIcon: { fontSize:48, color:'#2a2a2a' },
  verifiedBadge: { position:'absolute', top:12, right:12, background:'rgba(39,174,96,0.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20, letterSpacing:'0.08em' },

  // Avatar — fixed 80×80, perfectly circular, object-fit:cover, border so it pops
  avatarWrap: { width:80, height:80, borderRadius:'50%', overflow:'hidden', border:'3px solid #111', background:'#1a1a1a', margin:'-40px 0 0 20px', flexShrink:0 },
  avatar:     { width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' },
  avatarFallback: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:'#c9a96e', background:'#1a1a1a' },

  body:      { padding:'12px 20px 20px' },
  bizName:   { fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#f5f0eb', marginBottom:2 },
  designerName: { fontSize:12, color:'#5c5852', marginBottom:4 },
  specialty: { fontSize:13, color:'#9e9890', marginBottom:12 },
  meta:      { display:'flex', alignItems:'center', gap:8, marginBottom:12 },
  metaText:  { fontSize:12, color:'#5c5852' },
  chips:     { display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 },
  chip:      { background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:4, fontSize:11, color:'#5c5852', padding:'3px 8px' },
  styles:    { display:'flex', gap:6, flexWrap:'wrap' },
  styleTag:  { background:'rgba(201,169,110,0.08)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:4, fontSize:10, color:'#c9a96e', padding:'2px 8px', letterSpacing:'0.05em' },

  empty:     { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 40px', textAlign:'center' },
  emptyIcon: { fontSize:48, color:'#2a2a2a', marginBottom:20 },
  emptyTitle:{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb', marginBottom:8 },
  emptySub:  { color:'#5c5852', fontSize:14 },
  pagination:{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:48 },
};
