import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function Register() {
  const { saveUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', city:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      saveUser(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => { window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/google'; };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <Link to="/" style={s.brandLink}>
            <span style={{ color:'#c9a96e' }}>✦</span>
            <span style={s.brandName}>SpaceAura</span>
          </Link>
        </div>
        <h2 style={s.title}>Create your account</h2>
        <p style={s.subtitle}>Join thousands of design enthusiasts</p>

        <button onClick={handleGoogle} style={s.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign up with Google
        </button>

        <div style={s.divider}><span style={s.dividerText}>or with email</span></div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.name} onChange={set('name')} placeholder="Arjun Sharma" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div style={s.row}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={set('city')} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" required value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
        <p style={{ ...s.footer, marginTop:8 }}>Designer? <Link to="/vendor-register" style={s.link}>Register as Vendor</Link></p>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  card:      { width:'100%', maxWidth:560, background:'#111', border:'1px solid #1a1a1a', borderRadius:12, padding:'48px 48px' },
  brand:     { marginBottom:32 },
  brandLink: { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
  brandName: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb' },
  title:     { fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:'#f5f0eb', fontWeight:400, marginBottom:6 },
  subtitle:  { fontSize:14, color:'#5c5852', marginBottom:28 },
  googleBtn: { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:13, background:'#0f0f0f', border:'1px solid #2a2a2a', borderRadius:6, color:'#f5f0eb', fontSize:14, cursor:'pointer', marginBottom:20 },
  divider:   { display:'flex', alignItems:'center', gap:16, marginBottom:20 },
  dividerText: { fontSize:11, color:'#3a3a3a', letterSpacing:'0.08em', textTransform:'uppercase' },
  error:     { background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:6, padding:'12px 16px', fontSize:13, color:'#e74c3c', marginBottom:16 },
  form:      { display:'flex', flexDirection:'column', gap:14 },
  row:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  footer:    { fontSize:13, color:'#5c5852', textAlign:'center', marginTop:20 },
  link:      { color:'#c9a96e' },
};
