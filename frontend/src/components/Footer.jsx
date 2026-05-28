import { useState } from 'react';
import { Link } from 'react-router-dom';
import { newsletterApi } from '../lib/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState('');

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await newsletterApi.subscribe(email);
      setSubStatus('success');
      setEmail('');
    } catch { setSubStatus('error'); }
  };

  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.grid}>
          {/* Brand */}
          <div>
            <div style={s.brand}>
              <span style={s.brandIcon}>✦</span>
              <span style={s.brandName}>SpaceAura</span>
            </div>
            <p style={s.tagline}>Where spaces become stories. Curated furniture and interior design services for discerning homes.</p>
            <div style={s.socials}>
              {['Instagram', 'Pinterest', 'Houzz'].map(s2 => (
                <span key={s2} style={s.socialLink}>{s2}</span>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            ['Shop', [['Sofas & Sectionals','/shop?category=sofas'],['Beds & Mattresses','/shop?category=beds'],['Lighting','/shop?category=lighting'],['All Products','/shop']]],
            ['Services', [['Find a Designer','/vendors'],['Design Gallery','/designs'],['Vendor Registration','/vendor-register'],['Consultation','/vendors']]],
            ['Company', [['About SpaceAura','#'],['Blog','#'],['Careers','#'],['Contact','#']]],
          ].map(([title, links]) => (
            <div key={title}>
              <h4 style={s.colTitle}>{title}</h4>
              {links.map(([label, href]) => (
                <Link key={label} to={href} style={s.link}>{label}</Link>
              ))}
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 style={s.colTitle}>Newsletter</h4>
            <p style={s.nlText}>Get design inspiration and exclusive offers.</p>
            <form onSubmit={subscribe} style={s.nlForm}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" style={s.nlInput}
              />
              <button type="submit" style={s.nlBtn}>Subscribe</button>
            </form>
            {subStatus === 'success' && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 8 }}>Welcome to SpaceAura! ✦</p>}
            {subStatus === 'error'   && <p style={{ fontSize: 12, color: 'var(--red)',   marginTop: 8 }}>Something went wrong.</p>}
          </div>
        </div>

        <div style={s.bottom}>
          <span>© 2025 SpaceAura. All rights reserved.</span>
          <div style={s.bottomLinks}>
            {['Privacy Policy', 'Terms of Service', 'Returns'].map(l => (
              <span key={l} style={s.bottomLink}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: { borderTop: '1px solid #1a1a1a', background: '#080808', marginTop: 80 },
  inner:  { maxWidth: 1280, margin: '0 auto', padding: '64px 24px 32px' },
  grid:   { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 48, marginBottom: 48 },
  brand:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  brandIcon: { color: '#c9a96e', fontSize: 18 },
  brandName: { fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#f5f0eb' },
  tagline: { fontSize: 13, color: '#5c5852', lineHeight: 1.7, marginBottom: 20, maxWidth: 260 },
  socials: { display: 'flex', gap: 16 },
  socialLink: { fontSize: 11, color: '#5c5852', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' },
  colTitle: { fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9e9890', marginBottom: 16, fontWeight: 600 },
  link:     { display: 'block', fontSize: 13, color: '#5c5852', marginBottom: 10, textDecoration: 'none', transition: 'color 0.2s' },
  nlText:   { fontSize: 13, color: '#5c5852', marginBottom: 16, lineHeight: 1.6 },
  nlForm:   { display: 'flex', gap: 8 },
  nlInput:  { flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: '10px 14px', color: '#f5f0eb', fontSize: 13, outline: 'none' },
  nlBtn:    { background: '#c9a96e', color: '#0a0a0a', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  bottom:   { borderTop: '1px solid #1a1a1a', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#3a3a3a' },
  bottomLinks: { display: 'flex', gap: 24 },
  bottomLink:  { cursor: 'pointer' },
};
