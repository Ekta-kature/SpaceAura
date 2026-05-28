import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function Login() {
  const { saveUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(params.get('error') ? 'Google sign-in failed. Please try again.' : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      saveUser(data.user, data.accessToken, data.refreshToken);
      navigate(params.get('redirect') || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    // Redirect browser to backend Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <span style={s.brandIcon}>✦</span>
          <span style={s.brandName}>SpaceAura</span>
        </div>
        <h1 style={s.headline}>Design lives in the details.</h1>
        <p style={s.sub}>Sign in to curate your space, track orders and connect with top interior designers across India.</p>
        <div style={s.imageGrid}>
          {[
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80',
            'https://images.unsplash.com/photo-1615066945284-b9ceae1e9539?w=300&q=80',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80',
          ].map((src, i) => (
            <img key={i} src={src} alt="" style={{ ...s.gridImg, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.title}>Welcome back</h2>
          <p style={s.subtitle}>Sign in to your account</p>

          {/* Google OAuth */}
          <button onClick={handleGoogle} style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={s.divider}><span style={s.dividerText}>or sign in with email</span></div>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={s.footer}>
            Don't have an account? <Link to="/register" style={s.link}>Create one</Link>
          </p>
          <p style={{ ...s.footer, marginTop: 8 }}>
            Are you a designer? <Link to="/vendor-register" style={s.link}>Join as Vendor</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { display:'flex', minHeight:'100vh', background:'#0a0a0a' },
  left:      { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 80px', background:'linear-gradient(135deg,#0a0a0a 0%,#111 100%)', borderRight:'1px solid #1a1a1a' },
  brand:     { display:'flex', alignItems:'center', gap:10, marginBottom:48 },
  brandIcon: { color:'#c9a96e', fontSize:22 },
  brandName: { fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:'#f5f0eb', letterSpacing:'0.05em' },
  headline:  { fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, lineHeight:1.2, marginBottom:20 },
  sub:       { fontSize:15, color:'#5c5852', lineHeight:1.7, maxWidth:380, marginBottom:40 },
  imageGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxWidth:340 },
  gridImg:   { width:'100%', aspectRatio:'4/3', objectFit:'cover', borderRadius:6, filter:'brightness(0.7)', animation:'fadeUp 0.6s ease forwards', opacity:0 },
  right:     { width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 60px' },
  card:      { width:'100%' },
  title:     { fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:'#f5f0eb', fontWeight:400, marginBottom:6 },
  subtitle:  { fontSize:14, color:'#5c5852', marginBottom:32 },
  googleBtn: { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'13px', background:'#111', border:'1px solid #2a2a2a', borderRadius:6, color:'#f5f0eb', fontSize:14, cursor:'pointer', transition:'border-color 0.2s', marginBottom:24 },
  divider:   { display:'flex', alignItems:'center', gap:16, marginBottom:24 },
  dividerText: { fontSize:11, color:'#3a3a3a', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' },
  error:     { background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.3)', borderRadius:6, padding:'12px 16px', fontSize:13, color:'#e74c3c', marginBottom:20 },
  form:      { display:'flex', flexDirection:'column', gap:16, marginBottom:24 },
  footer:    { fontSize:13, color:'#5c5852', textAlign:'center' },
  link:      { color:'#c9a96e', textDecoration:'none' },
};
