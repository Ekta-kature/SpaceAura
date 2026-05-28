import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorsApi, authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function VendorRegister() {
  const { user, isLoggedIn, saveUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: create user account
  const [accountForm, setAccountForm] = useState({ name:'', email:'', password:'', phone:'', city:'' });
  // Step 2: vendor profile
  const [vendorForm, setVendorForm] = useState({
    businessName:'', specialty:'', bio:'', experience:'1', location:'', consultationFee:'2000',
    styles:[], coverImage:'',
  });

  const SPECIALTIES = ['Modern','Contemporary','Traditional','Minimalist','Industrial','Scandinavian','Bohemian','Luxury','Rustic'];

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await authApi.register({ ...accountForm, role:'VENDOR' });
      saveUser(data.user, data.accessToken, data.refreshToken);
      setStep(2);
    } catch (err) { setError(err.response?.data?.error || 'Registration failed.'); }
    setLoading(false);
  };

  const handleVendorProfile = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await vendorsApi.create(vendorForm);
      navigate('/vendor-dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Failed to create vendor profile.'); }
    setLoading(false);
  };

  const toggleStyle = (s) => setVendorForm(f => ({
    ...f, styles: f.styles.includes(s) ? f.styles.filter(x=>x!==s) : [...f.styles, s]
  }));

  const setA = (k) => (e) => setAccountForm(f=>({...f,[k]:e.target.value}));
  const setV = (k) => (e) => setVendorForm(f=>({...f,[k]:e.target.value}));

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', padding:'60px 24px' }}>
      <div style={{ maxWidth:620, margin:'0 auto' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:48 }}>
          <span style={{ color:'#c9a96e', fontSize:20 }}>✦</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb' }}>SpaceAura</span>
        </Link>

        <div style={{ display:'flex', gap:16, marginBottom:40, alignItems:'center' }}>
          {['Account Setup','Designer Profile'].map((label,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background: step>i+1?'var(--green)':step===i+1?'#c9a96e':'#1a1a1a', color: step===i+1||step>i+1?'#0a0a0a':'#5c5852' }}>
                {step>i+1?'✓':i+1}
              </div>
              <span style={{ fontSize:13, color: step===i+1?'#f5f0eb':'#5c5852' }}>{label}</span>
              {i<1 && <span style={{ color:'#2a2a2a', marginLeft:8 }}>—</span>}
            </div>
          ))}
        </div>

        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:'#f5f0eb', fontWeight:400, marginBottom:8 }}>
          {step===1 ? 'Create your account' : 'Set up your designer profile'}
        </h1>
        <p style={{ fontSize:14, color:'#5c5852', marginBottom:32 }}>
          {step===1 ? 'Join SpaceAura as a verified interior designer.' : 'Tell clients about your expertise and style.'}
        </p>

        {error && <div style={{ background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:6, padding:'12px 16px', fontSize:13, color:'#e74c3c', marginBottom:20 }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" required value={accountForm.name} onChange={setA('name')} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={accountForm.phone} onChange={setA('phone')} /></div>
            </div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" required value={accountForm.email} onChange={setA('email')} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" value={accountForm.city} onChange={setA('city')} /></div>
              <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" required value={accountForm.password} onChange={setA('password')} placeholder="Min. 6 characters" /></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Creating account...':'Continue →'}</button>
            <p style={{ fontSize:13, color:'#5c5852', textAlign:'center' }}>Already have an account? <Link to="/login" style={{ color:'#c9a96e' }}>Sign in</Link></p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVendorProfile} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">Business Name *</label><input className="form-input" required value={vendorForm.businessName} onChange={setV('businessName')} placeholder="Studio Name / Your Name" /></div>
              <div className="form-group"><label className="form-label">Specialty *</label><input className="form-input" required value={vendorForm.specialty} onChange={setV('specialty')} placeholder="e.g. Modern Residential" /></div>
            </div>
            <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" rows={3} value={vendorForm.bio} onChange={setV('bio')} placeholder="Tell clients about your design philosophy..." style={{ resize:'vertical' }} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div className="form-group"><label className="form-label">City / Location *</label><input className="form-input" required value={vendorForm.location} onChange={setV('location')} placeholder="Mumbai" /></div>
              <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-input" type="number" min="0" value={vendorForm.experience} onChange={setV('experience')} /></div>
              <div className="form-group"><label className="form-label">Consultation Fee (₹)</label><input className="form-input" type="number" value={vendorForm.consultationFee} onChange={setV('consultationFee')} /></div>
            </div>
            <div className="form-group"><label className="form-label">Cover Image URL</label><input className="form-input" value={vendorForm.coverImage} onChange={setV('coverImage')} placeholder="https://..." /></div>
            <div className="form-group">
              <label className="form-label">Design Styles (select all that apply)</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                {SPECIALTIES.map(s => (
                  <button type="button" key={s} onClick={() => toggleStyle(s)}
                    style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
                      background: vendorForm.styles.includes(s) ? 'rgba(201,169,110,0.15)' : 'transparent',
                      borderColor: vendorForm.styles.includes(s) ? '#c9a96e' : '#2a2a2a',
                      color: vendorForm.styles.includes(s) ? '#c9a96e' : '#5c5852',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Creating profile...':'Create Designer Profile'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
