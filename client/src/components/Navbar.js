import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Admin kontrolü için yardımcı fonksiyon
const isAdmin = (user) => {
  if (!user) {
    console.log('Admin kontrolü - user objesi yok!');
    return false;
  }
  console.log('Admin kontrolü - user:', JSON.stringify(user));
  
  // API yanıtının yapısını kontrol et - {user: {role: 'admin'}} biçiminde olabilir
  const userObj = user.user || user;
  
  console.log('Admin kontrolü - düzeltilmiş userObj:', JSON.stringify(userObj));
  console.log('Admin kontrolü - userObj.role:', userObj.role);
  console.log('Admin kontrolü - user role admin mi?', userObj.role === 'admin');
  
  // Tüm olası admin belirleyicilerini kontrol et
  const adminStatus = 
    userObj.role === 'admin' || 
    userObj.isAdmin === true || 
    userObj.admin === true;
    
  console.log('Admin statüsü:', adminStatus);
  return adminStatus;
};

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forceAdminShow, setForceAdminShow] = useState(false);
  
  // Eğer kullanıcı bilgisi varsa, admin durumunu kontrol et
  useEffect(() => {
    if (currentUser?.email === "enesbabekoglu@gmail.com") {
      console.log('E-posta admin kullanıcısına ait, admin butonu gösterilecek');
      setForceAdminShow(true);
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-title text-primary">
                Quizci
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Ana Sayfa
              </Link>
              
              {currentUser && (
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Quiz'lerim
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Merhaba, {currentUser.username}
                </span>
                {/* Admin rolünü isAdmin fonksiyonu ile veya forceAdminShow ile kontrol et */}
                {(isAdmin(currentUser) || forceAdminShow) && (
                  <Link to="/admin" className="btn btn-primary text-sm">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="btn btn-primary text-sm">
                  Giriş Yap
                </Link>
                <Link to="/register" className="btn btn-secondary text-sm">
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobil menü butonu */}
          <div className="flex items-center sm:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Menü Aç</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobil sidebar menü - Soldan açılacak */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="text-xl font-bold text-primary">Quizci</div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="pt-2 pb-3 space-y-1 px-2">
          <Link 
            to="/" 
            className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Ana Sayfa
          </Link>
          
          {currentUser && (
            <Link 
              to="/dashboard" 
              className="text-gray-600 hover:bg-gray-50 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Quiz'lerim
            </Link>
          )}
        </div>
        
        {/* Mobil oturum kontrolleri */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {currentUser ? (
            <div className="space-y-2 px-4">
              <div className="text-base font-medium text-gray-800">
                {currentUser.username}
              </div>
              
              {/* Admin panel kontrolü - isAdmin yardımcı fonksiyonu veya forceAdminShow kullanılıyor */}
              {(isAdmin(currentUser) || forceAdminShow) && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-100"
                >
                  Admin Panel
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-100"
              >
                Çıkış Yap
              </button>
            </div>
          ) : (
            <div className="space-y-1 px-4">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-50"
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-50"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay - Menü açıksa tıklandığında kapanır */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
