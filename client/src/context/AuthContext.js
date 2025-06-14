import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../utils/api';

// Context oluşturuluyor
const AuthContext = createContext();

// Context sağlayıcısı bileşeni
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Mevcut kullanıcı bilgilerini çek
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getCurrentUser();
      console.log('Kullanıcı bilgileri alındı:', response.data);
      
      // Backend'den gelen veri yapısı {user: {role: 'admin'}} şeklinde
      // Ya response.data'yı direk veya içindeki user nesnesini kullan
      const userData = response.data.user || response.data;
      console.log('Düzenlenmiş kullanıcı bilgileri:', userData);
      console.log('Kullanıcı rolü:', userData.role);
      
      // Kullanıcı verilerini genişletilmiş haliyle ayarla
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      console.error('Kullanıcı bilgileri alınamadı:', err);
      localStorage.removeItem('token');
      setCurrentUser(null);
      setError('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı girişi
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      localStorage.setItem('token', response.data.token);
      await fetchCurrentUser();
      return { success: true };
    } catch (err) {
      console.error('Giriş başarısız:', err);
      setError(err.response?.data?.message || 'Giriş yapılamadı.');
      return { success: false, error: err.response?.data?.message || 'Giriş yapılamadı.' };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı kaydı
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await AuthService.register(userData);
      localStorage.setItem('token', response.data.token);
      await fetchCurrentUser();
      return { success: true };
    } catch (err) {
      console.error('Kayıt başarısız:', err);
      setError(err.response?.data?.message || 'Kayıt yapılamadı.');
      return { success: false, error: err.response?.data?.message || 'Kayıt yapılamadı.' };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Context değerleri
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook olarak kullanım
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
