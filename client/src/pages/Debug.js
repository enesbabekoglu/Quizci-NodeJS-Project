import React from 'react';
import { useAuth } from '../context/AuthContext';

const Debug = () => {
  const { currentUser, fetchCurrentUser } = useAuth();

  const handleRefreshUser = async () => {
    await fetchCurrentUser();
    alert('Kullanıcı bilgileri yenilendi!');
    window.location.reload();
  };

  const handleClearAndLogin = () => {
    localStorage.removeItem('token');
    alert('Oturum bilgileri temizlendi! Lütfen tekrar giriş yapın.');
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Debug Bilgisi</h1>
      
      <div className="card bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Mevcut Kullanıcı Bilgisi</h2>
        
        {currentUser ? (
          <>
            <pre className="bg-gray-100 p-4 rounded overflow-auto mb-4">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
            <div className="flex space-x-2">
              <button 
                className="btn btn-primary" 
                onClick={handleRefreshUser}
              >
                Kullanıcı Bilgilerini Yenile
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleClearAndLogin}
              >
                Çıkış Yap ve Tekrar Giriş Yap
              </button>
            </div>
          </>
        ) : (
          <p className="text-red-500">Kullanıcı bilgisi bulunamadı. Giriş yapmış olduğunuzdan emin olun.</p>
        )}
      </div>
    </div>
  );
};

export default Debug;
