import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@sweafex/shared';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sweafex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sweafex_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('sweafex_user', JSON.stringify(res.data));
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.tokens.accessToken);
      localStorage.setItem('sweafex_token', res.data.tokens.accessToken);
      localStorage.setItem('sweafex_refresh_token', res.data.tokens.refreshToken);
      localStorage.setItem('sweafex_user', JSON.stringify(res.data.user));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sweafex_token');
    localStorage.removeItem('sweafex_refresh_token');
    localStorage.removeItem('sweafex_user');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true; // Superuser bypass
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
