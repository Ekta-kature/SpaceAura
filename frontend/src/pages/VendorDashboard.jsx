import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorsApi, productsApi, uploadsApi, categoriesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const LEAD_STATUS = ['NEW','REPLIED','CONSULTATION_BOOKED','CONVERTED','CLOSED'];

export default function VendorDashboard() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads]       = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('leads');
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioUrls, setPortfolioUrls] = useState([]);

  // New product form
  const [productForm, setProductForm] = useState({
    name:'', description:'', price:'', oldPrice:'', badge:'', categoryId:'', tags:'', images:[],
  });
  const [productLoading, setProductLoading] = useState(false);
  const [productSaved, setProductSaved]     = useState(false);

  useEffect(() => {
    if (!isLoggedIn || (user?.role !== 'VENDOR' && user?.role !== 'ADMIN')) {
      navigate('/login'); return;
    }
    Promise.all([
      vendorsApi.myLeads(),
      productsApi.list({ limit:20 }),
      categoriesApi.list(),
    ]).then(([l, p, c]) => {
      setLeads(l.data.leads || []);
      setProducts(p.data.products || []);
      setCategories(c.data.categories || []);
    }).finally(() => setLoading(false));
  }, [isLoggedIn, user]);

  const updateLeadStatus = async (leadId, status) => {
    await vendorsApi.updateLead(leadId, status);
    setLeads(prev => prev.map(l => l.id===leadId ? {...l,status} : l));
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPortfolioUploading(true);
    try {
      const { data } = await uploadsApi.portfolio(files);
      setPortfolioUrls(prev => [...prev, ...data.images.map(i=>i.url)]);
      alert(`${data.images.length} photo(s) uploaded successfully!`);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed. Check Cloudinary config.');
    }
    setPortfolioUploading(false);
  };

  const handleProductCreate = async (e) => {
    e.preventDefault(); setProductLoading(true);
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        oldPrice: productForm.oldPrice ? parseFloat(productForm.oldPrice) : undefined,
        tags: productForm.tags ? productForm.tags.split(',').map(t=>t.trim()) : [],
      };
      await productsApi.create(payload);
      setProductSaved(true);
      setProductForm({ name:'', description:'', price:'', oldPrice:'', badge:'', categoryId:'', tags:'', images:[] });
      setTimeout(() => setProductSaved(false), 3000);
      const { data } = await productsApi.list({ limit:20 });
      setProducts(data.products || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product.');
    }
    setProductLoading(false);
  };

  const setP = (k) => (e) => setProductForm(f=>({...f,[k]:e.target.value}));

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const statusColors = { NEW:'#3498db', REPLIED:'#e67e22', CONSULTATION_BOOKED:'#9b59b6', CONVERTED:'#27ae60', CLOSED:'#5c5852' };

  return (
    <div className="container" style={{ padding:'48px 24px' }}>
      <div style={{ marginBottom:40 }}>
        <p style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#c9a96e', marginBottom:8 }}>Vendor Dashboard</p>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400 }}>
          Welcome, {user?.name}
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:40 }}>
        {[
          ['Total Leads', leads.length, '#c9a96e'],
          ['New Leads', leads.filter(l=>l.status==='NEW').length, '#3498db'],
          ['Converted', leads.filter(l=>l.status==='CONVERTED').length, '#27ae60'],
          ['Products', products.length, '#9b59b6'],
        ].map(([label,val,color]) => (
          <div key={label} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:24 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:36, color, marginBottom:4 }}>{val}</div>
            <div style={{ fontSize:12, color:'#5c5852', letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1a1a1a', marginBottom:32 }}>
        {[['leads','Client Leads'],['products','Add Product'],['portfolio','Portfolio Upload']].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ background:'none', border:'none', padding:'12px 24px', fontSize:13, color: tab===key?'#c9a96e':'#5c5852', cursor:'pointer', borderBottom:`2px solid ${tab===key?'#c9a96e':'transparent'}`, marginBottom:-1, transition:'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* LEADS TAB */}
      {tab === 'leads' && (
        <div>
          {leads.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#5c5852' }}>No leads yet. Share your profile to get started!</div>
          ) : leads.map(lead => (
            <div key={lead.id} style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:24, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:16, color:'#f5f0eb', fontFamily:"'Cormorant Garamond',serif" }}>{lead.name}</div>
                  <div style={{ fontSize:13, color:'#5c5852', marginTop:4 }}>{lead.email} {lead.phone && `· ${lead.phone}`} {lead.city && `· ${lead.city}`}</div>
                  {lead.roomType && <div style={{ fontSize:12, color:'#9e9890', marginTop:8 }}>{lead.roomType} · {lead.budget}</div>}
                  {lead.message && <div style={{ fontSize:13, color:'#9e9890', marginTop:8, fontStyle:'italic' }}>"{lead.message}"</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                  <span style={{ background: statusColors[lead.status]+'20', color: statusColors[lead.status], border:`1px solid ${statusColors[lead.status]}40`, padding:'4px 12px', borderRadius:20, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {lead.status}
                  </span>
                  <select
                    className="form-input form-select"
                    style={{ fontSize:12, padding:'6px 28px 6px 10px', width:'auto' }}
                    value={lead.status}
                    onChange={e => updateLeadStatus(lead.id, e.target.value)}
                  >
                    {LEAD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ fontSize:11, color:'#3a3a3a' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <a href={`mailto:${lead.email}`} className="btn btn-outline btn-sm">Reply by Email</a>
                <Link to="/chat" className="btn btn-ghost btn-sm">Open Chat</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD PRODUCT TAB */}
      {tab === 'products' && (
        <div style={{ maxWidth:700 }}>
          <p style={{ color:'#5c5852', fontSize:14, marginBottom:24 }}>Add products to your store. Customers can buy them directly.</p>
          <form onSubmit={handleProductCreate} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" required value={productForm.name} onChange={setP('name')} /></div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input form-select" required value={productForm.categoryId} onChange={setP('categoryId')}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} required value={productForm.description} onChange={setP('description')} style={{ resize:'vertical' }} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" required value={productForm.price} onChange={setP('price')} /></div>
              <div className="form-group"><label className="form-label">Original Price (₹)</label><input className="form-input" type="number" value={productForm.oldPrice} onChange={setP('oldPrice')} placeholder="For discount display" /></div>
              <div className="form-group">
                <label className="form-label">Badge</label>
                <select className="form-input form-select" value={productForm.badge} onChange={setP('badge')}>
                  <option value="">None</option>
                  {['New','Bestseller','Sale','Limited','Featured'].map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Tags (comma separated)</label><input className="form-input" value={productForm.tags} onChange={setP('tags')} placeholder="modern, sofa, living room" /></div>
            <div className="form-group">
              <label className="form-label">Image URLs (one per line)</label>
              <textarea className="form-input" rows={3} style={{ resize:'vertical' }}
                placeholder="https://images.unsplash.com/..."
                onChange={e => setProductForm(f=>({...f, images: e.target.value.split('\n').map(u=>u.trim()).filter(Boolean) }))}
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button type="submit" className="btn btn-primary" disabled={productLoading}>{productLoading?'Creating...':'Add Product'}</button>
              {productSaved && <span style={{ color:'var(--green)', fontSize:13 }}>✓ Product created!</span>}
            </div>
          </form>

          {products.length > 0 && (
            <div style={{ marginTop:40 }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#f5f0eb', marginBottom:16 }}>Your Products</h3>
              {products.map(p => (
                <div key={p.id} style={{ display:'flex', gap:16, padding:'16px', background:'#111', border:'1px solid #1a1a1a', borderRadius:8, marginBottom:8, alignItems:'center' }}>
                  {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} style={{ width:56, height:56, objectFit:'cover', borderRadius:4 }} />}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:'#f5f0eb' }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'#5c5852' }}>{p.category?.name}</div>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", color:'#c9a96e' }}>₹{p.price?.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PORTFOLIO UPLOAD TAB */}
      {tab === 'portfolio' && (
        <div style={{ maxWidth:600 }}>
          <p style={{ color:'#5c5852', fontSize:14, marginBottom:24 }}>Upload portfolio photos to showcase your design work. These appear on your public profile.</p>
          <div style={{ border:'2px dashed #2a2a2a', borderRadius:8, padding:'48px 40px', textAlign:'center', background:'#0d0d0d' }}>
            <div style={{ fontSize:40, color:'#2a2a2a', marginBottom:16 }}>◈</div>
            <p style={{ color:'#5c5852', marginBottom:20, fontSize:14 }}>Upload high-quality project photos (JPG, PNG, WEBP)</p>
            <input type="file" id="portfolio-input" multiple accept="image/*" onChange={handlePortfolioUpload} style={{ display:'none' }} />
            <label htmlFor="portfolio-input" className="btn btn-outline" style={{ cursor:'pointer' }}>
              {portfolioUploading ? 'Uploading...' : 'Choose Photos'}
            </label>
          </div>
          {portfolioUrls.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:24 }}>
              {portfolioUrls.map((url, i) => (
                <img key={i} src={url} alt="Portfolio" style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:6 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
