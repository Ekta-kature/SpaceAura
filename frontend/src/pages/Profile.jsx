import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, uploadsApi } from '../lib/api';

export default function Profile() {
  const { user, saveUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]       = useState({ name:'', phone:'', city:'' });
  const [pwForm, setPwForm]   = useState({ currentPassword:'', newPassword:'' });
  const [pwMsg, setPwMsg]     = useState('');
  const fileRef = useRef();

  useEffect(() => {
    usersApi.profile().then(({ data }) => {
      setProfile(data.user);
      setForm({ name: data.user.name||'', phone: data.user.phone||'', city: data.user.city||'' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setSaved(false);
    try {
      const { data } = await usersApi.updateProfile(form);
      setProfile(p => ({ ...p, ...data.user }));
      saveUser({ ...user, ...data.user }, localStorage.getItem('sa_token'), localStorage.getItem('sa_refresh'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadsApi.avatar(file);
      setProfile(p => ({ ...p, avatar: data.url }));
      saveUser({ ...user, avatar: data.url }, localStorage.getItem('sa_token'), localStorage.getItem('sa_refresh'));
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed. Make sure Cloudinary is configured.');
    }
    setUploading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setPwMsg('');
    try {
      const { default: api } = await import('../lib/api');
      await api.put('/auth/change-password', pwForm);
      setPwMsg('Password updated successfully!');
      setPwForm({ currentPassword:'', newPassword:'' });
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to update password.');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding:'48px 24px', maxWidth:720 }}>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, color:'#f5f0eb', fontWeight:400, marginBottom:40 }}>My Profile</h1>

      {/* Avatar */}
      <div style={s.avatarSection}>
        <div style={s.avatarWrap}>
          {profile?.avatar
            ? <img src={profile.avatar} alt="Avatar" style={s.avatarImg} />
            : <div style={s.avatarFallback}>{profile?.name?.[0]?.toUpperCase()}</div>
          }
          {uploading && (
            <div style={s.avatarOverlay}><div className="spinner" style={{ width:24, height:24 }} /></div>
          )}
        </div>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#f5f0eb', marginBottom:4 }}>{profile?.name}</h2>
          <p style={{ fontSize:13, color:'#5c5852', marginBottom:12 }}>{profile?.email} · {profile?.role}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:'none' }} />
          <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Personal Information</h3>
        <form onSubmit={handleSave} style={s.form}>
          <div style={s.row}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span style={{ color:'var(--green)', fontSize:13 }}>✓ Saved!</span>}
          </div>
        </form>
      </div>

      {/* Password */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Change Password</h3>
        <form onSubmit={handlePasswordChange} style={s.form}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e=>setPwForm(f=>({...f,currentPassword:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwForm.newPassword} onChange={e=>setPwForm(f=>({...f,newPassword:e.target.value}))} placeholder="Min. 6 characters" />
          </div>
          {pwMsg && <p style={{ fontSize:13, color: pwMsg.includes('success') ? 'var(--green)' : 'var(--red)' }}>{pwMsg}</p>}
          <button type="submit" className="btn btn-outline btn-sm">Update Password</button>
        </form>
      </div>

      {/* Stats */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Account Stats</h3>
        <div style={s.statsGrid}>
          {[
            ['Orders',   profile?._count?.orders   || 0],
            ['Wishlist', profile?._count?.wishlist  || 0],
            ['Member Since', new Date(profile?.createdAt).toLocaleDateString('en-IN',{year:'numeric',month:'short'})],
          ].map(([label, val]) => (
            <div key={label} style={s.stat}>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  avatarSection: { display:'flex', gap:24, alignItems:'center', marginBottom:40, padding:24, background:'#111', border:'1px solid #1a1a1a', borderRadius:8 },
  avatarWrap:    { width:96, height:96, borderRadius:'50%', overflow:'hidden', background:'#1a1a1a', flexShrink:0, position:'relative' },
  avatarImg:     { width:'100%', height:'100%', objectFit:'cover' },
  avatarFallback:{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:40, color:'#c9a96e' },
  avatarOverlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' },
  card:          { background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:28, marginBottom:20 },
  cardTitle:     { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#f5f0eb', marginBottom:20 },
  form:          { display:'flex', flexDirection:'column', gap:14 },
  row:           { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  statsGrid:     { display:'flex', gap:32 },
  stat:          { display:'flex', flexDirection:'column', gap:4 },
  statVal:       { fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#c9a96e' },
  statLabel:     { fontSize:11, color:'#5c5852', letterSpacing:'0.1em', textTransform:'uppercase' },
};
