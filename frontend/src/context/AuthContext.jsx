import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const userData = res.data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/profile/me', data);
      if (res.data.success) {
        const updated = res.data.data;
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
