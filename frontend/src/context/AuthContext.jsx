import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const saveUser = useCallback((userData, token, refresh) => {
    setUser(userData);
    if (token)   localStorage.setItem('sa_token',   token);
    if (refresh) localStorage.setItem('sa_refresh',  refresh);
    if (token)   connectSocket(token);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_refresh');
    disconnectSocket();
    setUser(null);
  }, []);

  // On mount — restore session
  useEffect(() => {
    const token = localStorage.getItem('sa_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, saveUser, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
