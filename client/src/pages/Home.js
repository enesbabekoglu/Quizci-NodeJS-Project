import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const handleJoinSession = (e) => {
    e.preventDefault();
    
    if (!pin || pin.length !== 6) {
      setError('Lütfen geçerli bir 6 haneli PIN girin');
      return;
    }
    
    // PIN kodu ile oturuma katıl
    navigate(`/join/${pin}`);
  };
  
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="mt-2 text-4xl sm:text-5xl font-title text-primary">
            Quizci'ye Hoş Geldiniz!
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Gerçek zamanlı quiz'lerle öğrenmeyi ve eğlenmeyi bir araya getiren platform
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sol: Quiz'e Katılma */}
          <div className="card bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold text-secondary mb-6">Quiz'e Katıl</h2>
            <p className="text-gray-600 mb-6">
              Bir Quizci oturumuna katılmak için eğitmeninizden aldığınız 6 haneli PIN kodunu girin.
            </p>
            
            <form onSubmit={handleJoinSession}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Kodu
                </label>
                <input
                  type="text"
                  id="pin"
                  name="pin"
                  maxLength="6"
                  placeholder="6 haneli PIN"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  className="input text-center text-2xl tracking-widest font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full btn btn-primary py-3 text-lg"
              >
                Quiz'e Katıl
              </button>
            </form>
          </div>
          
          {/* Sağ: Quiz Oluşturma veya Giriş */}
          <div className="card bg-white shadow-lg rounded-lg p-8">
            {currentUser ? (
              <>
                <h2 className="text-2xl font-bold text-secondary mb-6">Quiz Oluştur</h2>
                <p className="text-gray-600 mb-6">
                  Kendi quiz'lerinizi oluşturun, yönetin ve gerçek zamanlı oturumlar başlatın.
                </p>
                <Link to="/dashboard" className="block w-full btn btn-secondary py-3 text-lg text-center">
                  Kontrol Paneline Git
                </Link>
                <Link to="/create-quiz" className="block w-full btn btn-primary py-3 text-lg mt-4 text-center">
                  Yeni Quiz Oluştur
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-secondary mb-6">Quiz Oluştur</h2>
                <p className="text-gray-600 mb-6">
                  Quiz oluşturmak ve yönetmek için giriş yapmalı veya kayıt olmalısınız.
                </p>
                <Link to="/login" className="block w-full btn btn-primary py-3 text-lg text-center">
                  Giriş Yap
                </Link>
                <Link to="/register" className="block w-full btn btn-secondary py-3 text-lg mt-4 text-center">
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-secondary mb-8">Quizci ile Neler Yapabilirsiniz?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center p-6">
              <div className="text-primary text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-2">Etkileşimli Quiz'ler</h3>
              <p className="text-gray-600">
                İlgi çekici, etkileşimli ve gerçek zamanlı quiz deneyimi sunun.
              </p>
            </div>
            <div className="card text-center p-6">
              <div className="text-primary text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Anında Sonuçlar</h3>
              <p className="text-gray-600">
                Katılımcı cevaplarını gerçek zamanlı olarak görün ve analiz edin.
              </p>
            </div>
            <div className="card text-center p-6">
              <div className="text-primary text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">Rekabet ve Eğlence</h3>
              <p className="text-gray-600">
                Puan tablosu ile rekabet edin ve eğlenerek öğrenin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
