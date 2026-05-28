import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vendorsApi, chatApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function Stars({ rating, size=14 }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i<=Math.round(rating)?'#c9a96e':'#2a2a2a', fontSize:size }}>★</span>
      ))}
    </div>
  );
}

export default function VendorProfile() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [vendor, setVendor]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [chatLoading, setChatLoading] = useState(false);

  // Lead form
  const [leadForm, setLeadForm] = useState({ name:'', email:'', phone:'', city:'', roomType:'', budget:'', message:'' });
  const [leadSent, setLeadSent] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Consult booking
  const [consultForm, setConsultForm] = useState({ customerName:'', customerEmail:'', customerPhone:'', date:'', meetingType:'video', message:'' });
  const [consultSent, setConsultSent] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [showConsult, setShowConsult] = useState(false);

  useEffect(() => {
    vendorsApi.get(id)
      .then(({ data }) => setVendor(data.vendor))
      .finally(() => setLoading(false));

    // Pre-fill if logged in
    if (user) {
      setLeadForm(f => ({ ...f, name: user.name||'', email: user.email||'' }));
      setConsultForm(f => ({ ...f, customerName: user.name||'', customerEmail: user.email||'' }));
    }
  }, [id]);

  const handleChat = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setChatLoading(true);
    try {
      const vendorUserId = vendor.userId;
      const { data } = await chatApi.create(vendorUserId);
      navigate(`/chat?conversation=${data.conversation.id}`);
    } catch { setChatLoading(false); }
  };

  const handleLead = async (e) => {
    e.preventDefault();
    setLeadLoading(true);
    try {
      await vendorsApi.submitLead(vendor.id, leadForm);
      setLeadSent(true);
    } catch {}
    setLeadLoading(false);
  };

  const handleConsult = async (e) => {
    e.preventDefault();
    setConsultLoading(true);
    try {
      await vendorsApi.bookConsult(vendor.id, consultForm);
      setConsultSent(true);
    } catch {}
    setConsultLoading(false);
  };

  const setL = (k) => (e) => setLeadForm(f=>({...f,[k]:e.target.value}));
  const setC = (k) => (e) => setConsultForm(f=>({...f,[k]:e.target.value}));

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!vendor) return <div className="page-loader"><p style={{ color:'#5c5852' }}>Designer not found.</p></div>;

  const user2 = vendor.user || {};
  const reviews = vendor.reviews || [];
  const portfolio = vendor.portfolioImages || [];

  return (
    <div>
      {/* Hero cover */}
      <div style={s.hero}>
        {vendor.coverImage
          ? <img src={vendor.coverImage} alt={vendor.businessName} style={s.heroCoverImg} />
          : <div style={s.heroCoverPlaceholder} />
        }
        <div style={s.heroOverlay} />
      </div>

      <div className="container" style={{ padding:'0 24px 80px' }}>
        {/* Profile header */}
        <div style={s.profileHeader}>
          {/* Avatar — properly sized, no cropping */}
          <div style={s.avatarOuter}>
            {user2.avatar
              ? <img src={user2.avatar} alt={user2.name} style={s.avatar} />
              : <div style={s.avatarFallback}>{user2.name?.[0]?.toUpperCase()}</div>
            }
          </div>
          <div style={s.profileInfo}>
            <div style={s.profileTop}>
              <div>
                <h1 style={s.bizName}>{vendor.businessName}</h1>
                <p style={s.designerName}>by {user2.name}</p>
                <div style={s.ratingRow}>
                  <Stars rating={vendor.rating} />
                  <span style={s.ratingText}>{vendor.rating.toFixed(1)} · {vendor.totalReviews} reviews · {vendor.totalProjects} projects</span>
                </div>
              </div>
              <div style={s.profileActions}>
                <button onClick={handleChat} className="btn btn-primary" disabled={chatLoading}>
                  {chatLoading ? '...' : '💬 Message'}
                </button>
                <button onClick={()=>setShowConsult(!showConsult)} className="btn btn-outline">
                  📅 Book Consultation
                </button>
              </div>
            </div>

            <div style={s.chips}>
              {[
                vendor.specialty,
                vendor.location,
                `${vendor.experience} yrs experience`,
                vendor.isVerified && '✓ Verified',
              ].filter(Boolean).map(t => (
                <span key={t} style={s.chip}>{t}</span>
              ))}
            </div>

            {vendor.styles?.length > 0 && (
              <div style={s.styleTags}>
                {vendor.styles.map(style => (
                  <span key={style} style={s.styleTag}>{style}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consultation fee */}
        <div style={s.feeBar}>
          <span style={s.feeLabel}>Consultation Fee</span>
          <span style={s.feeAmount}>₹{vendor.consultationFee?.toLocaleString('en-IN')}</span>
          <span style={s.feeSub}>· one-time, includes project brief review</span>
        </div>

        {/* Consultation Modal */}
        {showConsult && (
          <div style={s.consultBox}>
            <div style={s.consultHeader}>
              <h3 style={s.consultTitle}>Book a Consultation</h3>
              <button onClick={()=>setShowConsult(false)} style={s.closeBtn}>✕</button>
            </div>
            {consultSent ? (
              <p style={{ color:'var(--green)', fontSize:14 }}>✓ Consultation booked! {vendor.businessName} will contact you shortly.</p>
            ) : (
              <form onSubmit={handleConsult} style={s.form}>
                <div style={s.row2}>
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input className="form-input" required value={consultForm.customerName} onChange={setC('customerName')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required value={consultForm.customerEmail} onChange={setC('customerEmail')} />
                  </div>
                </div>
                <div style={s.row2}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={consultForm.customerPhone} onChange={setC('customerPhone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Date *</label>
                    <input className="form-input" type="date" required value={consultForm.date} onChange={setC('date')} min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Meeting Type</label>
                  <select className="form-input form-select" value={consultForm.meetingType} onChange={setC('meetingType')}>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={3} value={consultForm.message} onChange={setC('message')} placeholder="Tell them about your project..." style={{ resize:'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={consultLoading}>
                  {consultLoading ? 'Booking...' : `Book for ₹${vendor.consultationFee?.toLocaleString('en-IN')}`}
                </button>
              </form>
            )}
          </div>
        )}

        <div style={s.mainLayout}>
          {/* Left: tabs */}
          <div style={{ flex:1 }}>
            {/* Bio */}
            {vendor.bio && (
              <div style={s.bioBox}>
                <p style={s.bio}>{vendor.bio}</p>
              </div>
            )}

            {/* Tabs */}
            <div style={s.tabs}>
              {[['portfolio','Portfolio'], ['reviews','Reviews']].map(([key,label]) => (
                <button key={key} onClick={()=>setActiveTab(key)} style={{ ...s.tab, ...(activeTab===key ? s.tabActive : {}) }}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'portfolio' && (
              <div>
                {portfolio.length === 0
                  ? <div style={s.empty}><p style={{ color:'#5c5852' }}>No portfolio images yet.</p></div>
                  : (
                    <div style={s.portfolioGrid}>
                      {portfolio.map((img, i) => (
                        <div key={img.id} style={{ ...s.portfolioItem, gridColumn: i===0?'span 2':'span 1' }}>
                          <img src={img.url} alt={img.caption||'Portfolio'} style={s.portfolioImg} />
                          {img.caption && <div style={s.portfolioCaption}>{img.caption}</div>}
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {activeTab === 'reviews' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {reviews.length === 0
                  ? <p style={{ color:'#5c5852' }}>No reviews yet.</p>
                  : reviews.map(r => (
                    <div key={r.id} style={s.review}>
                      <div style={s.reviewHeader}>
                        <div style={s.reviewAvatar}>
                          {r.user.avatar ? <img src={r.user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:'#c9a96e' }}>{r.user.name?.[0]}</span>}
                        </div>
                        <div>
                          <div style={{ fontSize:14, color:'#f5f0eb' }}>{r.user.name}</div>
                          <Stars rating={r.rating} size={12} />
                        </div>
                        <span style={{ marginLeft:'auto', fontSize:12, color:'#3a3a3a' }}>{new Date(r.createdAt).toLocaleDateString('en-IN',{year:'numeric',month:'short'})}</span>
                      </div>
                      <p style={{ fontSize:14, color:'#9e9890', lineHeight:1.7 }}>{r.comment}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Right: Send Enquiry */}
          <div style={s.sidebar}>
            <h3 style={s.sidebarTitle}>Send an Enquiry</h3>
            {leadSent ? (
              <p style={{ color:'var(--green)', fontSize:14 }}>✓ Enquiry sent! {vendor.businessName} will get back to you.</p>
            ) : (
              <form onSubmit={handleLead} style={s.form}>
                {[['name','Your Name *','','text'],['email','Email *','','email'],['phone','Phone','','tel'],['city','Your City','','text']].map(([k,label,placeholder,type]) => (
                  <div key={k} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} required={k==='name'||k==='email'} value={leadForm[k]} onChange={setL(k)} placeholder={placeholder} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Room Type</label>
                  <select className="form-input form-select" value={leadForm.roomType} onChange={setL('roomType')}>
                    <option value="">Select...</option>
                    {['Living Room','Bedroom','Kitchen','Bathroom','Full Home','Office','Other'].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget</label>
                  <select className="form-input form-select" value={leadForm.budget} onChange={setL('budget')}>
                    <option value="">Select...</option>
                    {['Under ₹1L','₹1L – ₹3L','₹3L – ₹5L','₹5L – ₹10L','₹10L+'].map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={3} value={leadForm.message} onChange={setL('message')} placeholder="Describe your vision..." style={{ resize:'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={leadLoading}>
                  {leadLoading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  hero:               { height:360, position:'relative', overflow:'hidden', background:'#0f0f0f' },
  heroCoverImg:       { width:'100%', height:'100%', objectFit:'cover' },
  heroCoverPlaceholder: { width:'100%', height:'100%', background:'linear-gradient(135deg,#1a1a1a,#0d0d0d)' },
  heroOverlay:        { position:'absolute', inset:0, background:'linear-gradient(transparent 40%,rgba(10,10,10,0.9))' },

  profileHeader:  { display:'flex', gap:24, marginTop:-60, position:'relative', zIndex:1, marginBottom:32 },
  // Avatar — 120×120 circle, top positioned, fully contained
  avatarOuter:    { width:120, height:120, borderRadius:'50%', overflow:'hidden', border:'4px solid #0a0a0a', background:'#1a1a1a', flexShrink:0, alignSelf:'flex-end' },
  avatar:         { width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' },
  avatarFallback: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:48, color:'#c9a96e' },

  profileInfo:    { flex:1, paddingTop:72 },
  profileTop:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:24, marginBottom:16 },
  profileActions: { display:'flex', gap:12, flexShrink:0 },

  bizName:      { fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:'#f5f0eb', fontWeight:400, marginBottom:4 },
  designerName: { fontSize:14, color:'#5c5852', marginBottom:10 },
  ratingRow:    { display:'flex', alignItems:'center', gap:10 },
  ratingText:   { fontSize:13, color:'#5c5852' },
  chips:        { display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 },
  chip:         { background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:4, fontSize:12, color:'#9e9890', padding:'4px 12px' },
  styleTags:    { display:'flex', gap:8, flexWrap:'wrap' },
  styleTag:     { background:'rgba(201,169,110,0.08)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:4, fontSize:11, color:'#c9a96e', padding:'3px 10px' },

  feeBar:     { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:'16px 24px', display:'flex', alignItems:'center', gap:12, marginBottom:32 },
  feeLabel:   { fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'#5c5852' },
  feeAmount:  { fontFamily:"'DM Mono',monospace", fontSize:24, color:'#c9a96e', fontWeight:600 },
  feeSub:     { fontSize:13, color:'#5c5852' },

  consultBox: { background:'#111', border:'1px solid #2a2a2a', borderRadius:8, padding:28, marginBottom:32 },
  consultHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  consultTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb' },
  closeBtn:   { background:'none', border:'none', color:'#5c5852', fontSize:18, cursor:'pointer' },

  bioBox:     { background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:8, padding:24, marginBottom:32 },
  bio:        { fontSize:15, color:'#9e9890', lineHeight:1.8 },

  tabs:       { display:'flex', gap:0, borderBottom:'1px solid #1a1a1a', marginBottom:32 },
  tab:        { background:'none', border:'none', padding:'12px 24px', fontSize:13, color:'#5c5852', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:-1, transition:'all 0.2s' },
  tabActive:  { color:'#c9a96e', borderBottomColor:'#c9a96e' },

  portfolioGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 },
  portfolioItem: { position:'relative', overflow:'hidden', aspectRatio:'1/1', background:'#0f0f0f', cursor:'pointer' },
  portfolioImg:  { width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.3s' },
  portfolioCaption: { position:'absolute', bottom:0, left:0, right:0, padding:'24px 12px 12px', background:'linear-gradient(transparent,rgba(0,0,0,0.8))', fontSize:12, color:'#f5f0eb', opacity:0, transition:'opacity 0.3s' },

  review:       { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:20 },
  reviewHeader: { display:'flex', gap:12, alignItems:'center', marginBottom:12 },
  reviewAvatar: { width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  mainLayout: { display:'grid', gridTemplateColumns:'1fr 360px', gap:40 },
  sidebar:    { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, position:'sticky', top:88, height:'fit-content' },
  sidebarTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', marginBottom:20 },
  form:       { display:'flex', flexDirection:'column', gap:14 },
  row2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },

  empty:      { padding:'40px 0', textAlign:'center' },
};
