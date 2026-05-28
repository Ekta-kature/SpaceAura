import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>SpaceAura</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {[['Shop', '/shop'], ['Vendors', '/vendors']].map(([label, path]) => (
            <Link key={path} to={path} style={{ ...styles.link, ...(isActive(path) ? styles.linkActive : {}) }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={styles.actions}>
          <Link to="/shop" style={styles.iconBtn} title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>

          {user && (
            <Link to="/wishlist" style={styles.iconBtn} title="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>
          )}

          <Link to="/cart" style={{ ...styles.iconBtn, position: 'relative' }} title="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {count > 0 && (
              <span style={styles.badge}>{count > 9 ? '9+' : count}</span>
            )}
          </Link>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={styles.avatarBtn}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={styles.avatarImg} />
                  : <span style={styles.avatarFallback}>{user.name?.[0]?.toUpperCase()}</span>
                }
              </button>
              {userMenuOpen && (
                <div style={styles.dropdown} onMouseLeave={() => setUserMenuOpen(false)}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.dropdownName}>{user.name}</div>
                    <div style={styles.dropdownEmail}>{user.email}</div>
                  </div>
                  <div style={styles.dropdownDivider}/>
                  {[
                    ['/dashboard', 'Dashboard'],
                    ['/orders', 'My Orders'],
                    ['/profile', 'Profile'],
                    ...(user.role === 'VENDOR' ? [['/vendor-dashboard', 'Vendor Dashboard']] : []),
                    ...(user.role === 'ADMIN'  ? [['/admin', 'Admin Panel']] : []),
                  ].map(([path, label]) => (
                    <Link key={path} to={path} style={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {label}
                    </Link>
                  ))}
                  <div style={styles.dropdownDivider}/>
                  <button onClick={handleLogout} style={styles.dropdownItem}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: { position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1a1a1a' },
  inner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoIcon: { color: '#c9a96e', fontSize: 20 },
  logoText: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: '#f5f0eb', letterSpacing: '0.05em' },
  links: { display: 'flex', gap: 32 },
  link: { fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9e9890', transition: 'color 0.2s' },
  linkActive: { color: '#c9a96e' },
  actions: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 4, color: '#9e9890', border: 'none', background: 'none', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' },
  badge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, background: '#c9a96e', borderRadius: '50%', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontWeight: 700 },
  avatarBtn: { width: 36, height: 36, borderRadius: '50%', border: '1px solid #2a2a2a', background: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: { fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: '#c9a96e' },
  dropdown: { position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  dropdownHeader: { padding: '16px 20px', background: '#0f0f0f' },
  dropdownName: { fontSize: 14, fontWeight: 500, color: '#f5f0eb' },
  dropdownEmail: { fontSize: 12, color: '#5c5852', marginTop: 2 },
  dropdownDivider: { height: 1, background: '#1a1a1a' },
  dropdownItem: { display: 'block', width: '100%', padding: '12px 20px', fontSize: 13, color: '#9e9890', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', textDecoration: 'none' },
};
