import type { AuthUser, AuthContextType } from '@/types';
import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from '.';

const API_URL = import.meta.env.VITE_EVENTS_API_URL;

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tryToLoginUser = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get profile');
          }
          const profile: AuthUser = await response.json();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        } catch {
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    tryToLoginUser();
  }, [token]);

  const login = (token: string) => {
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = Boolean(token && user);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
