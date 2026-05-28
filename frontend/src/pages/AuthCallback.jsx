import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { saveUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token   = params.get('token');
    const refresh = params.get('refresh');
    const error   = params.get('error');

    if (error || !token) {
      navigate('/login?error=' + (error || 'google_failed'));
      return;
    }

    const user = {
      id:     params.get('id'),
      name:   params.get('name'),
      email:  params.get('email'),
      role:   params.get('role'),
      avatar: params.get('avatar') || null,
    };

    saveUser(user, token, refresh);
    navigate('/dashboard');
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a0a', flexDirection:'column', gap:16 }}>
      <div className="spinner" style={{ width:32, height:32 }} />
      <p style={{ color:'#9e9890', fontSize:14 }}>Signing you in with Google...</p>
    </div>
  );
}
